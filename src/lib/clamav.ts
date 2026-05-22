import net from 'net';

/**
 * ClamAV TCP client using the INSTREAM protocol for malware scanning.
 *
 * Environment variables:
 * - CLAMAV_HOST     (default: "localhost")
 * - CLAMAV_PORT     (default: 3310)
 * - CLAMAV_TIMEOUT  (default: 30000 ms)
 * - CLAMAV_ENABLED  (default: "true", set to "false" to skip scanning)
 */

const CLAMAV_HOST = process.env.CLAMAV_HOST ?? 'localhost';
const CLAMAV_PORT = parseInt(process.env.CLAMAV_PORT ?? '3310', 10);
const CLAMAV_TIMEOUT = parseInt(process.env.CLAMAV_TIMEOUT ?? '30000', 10);
const CLAMAV_ENABLED = process.env.CLAMAV_ENABLED ?? 'true';

const MAX_CHUNK_SIZE = 2048; // ClamAV INSTREAM max chunk size in bytes

export interface ClamAVResult {
  isClean: boolean;
  virusName?: string;
  error?: string;
}

/**
 * Returns whether ClamAV scanning is enabled via the CLAMAV_ENABLED env var.
 */
export function isClamAVEnabled(): boolean {
  return CLAMAV_ENABLED.toLowerCase() !== 'false';
}

/**
 * Scans a file buffer for malware using ClamAV's INSTREAM protocol.
 *
 * Protocol flow:
 *   1. Connect to ClamAV TCP socket
 *   2. Send "nINSTREAM\n" command
 *   3. Send buffer in chunks (4-byte big-endian length prefix + data)
 *   4. Send 0-length chunk to signal end
 *   5. Read response for "OK" or "FOUND"
 *   6. Close connection
 *
 * Fail-closed policy: if ClamAV is enabled but unreachable, returns
 * `{ isClean: false, error: ... }`. If disabled, returns `{ isClean: true }`.
 */
export function scanFile(buffer: Buffer): Promise<ClamAVResult> {
  if (!isClamAVEnabled()) {
    return Promise.resolve({ isClean: true });
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(CLAMAV_TIMEOUT);

    let responseData = '';

    socket.on('data', (data: Buffer) => {
      responseData += data.toString('utf-8');
    });

    socket.on('end', () => {
      const response = responseData.trim();

      if (response.endsWith('OK')) {
        resolve({ isClean: true });
      } else if (response.includes('FOUND')) {
        // Response format: "stream: <virus_name> FOUND"
        const foundMatch = response.match(/stream:\s*(.+?)\s*FOUND/);
        const virusName = foundMatch ? foundMatch[1] : response;
        resolve({ isClean: false, virusName });
      } else {
        resolve({ isClean: false, error: `Unexpected ClamAV response: ${response}` });
      }
    });

    socket.on('error', (err: Error) => {
      resolve({ isClean: false, error: `ClamAV connection error: ${err.message}` });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ isClean: false, error: 'ClamAV connection timed out' });
    });

    socket.connect(CLAMAV_PORT, CLAMAV_HOST, () => {
      // Send INSTREAM command
      socket.write('nINSTREAM\n');

      // Send buffer in chunks with 4-byte big-endian length prefix
      let offset = 0;
      while (offset < buffer.length) {
        const chunk = buffer.subarray(offset, offset + MAX_CHUNK_SIZE);
        const lengthPrefix = Buffer.alloc(4);
        lengthPrefix.writeUInt32BE(chunk.length, 0);
        socket.write(lengthPrefix);
        socket.write(chunk);
        offset += MAX_CHUNK_SIZE;
      }

      // Send 0-length chunk to signal end of stream
      const zeroLength = Buffer.alloc(4);
      zeroLength.writeUInt32BE(0, 0);
      socket.write(zeroLength);
    });
  });
}