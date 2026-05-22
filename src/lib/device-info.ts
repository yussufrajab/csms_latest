/**
 * Client-side device information utility.
 * Collects browser, OS, and device details for audit logging.
 */

export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: string;
  userAgent: string;
  screenResolution: string;
}

/**
 * Parse the User-Agent string to extract browser and OS info.
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return {
    browser: parseBrowser(ua),
    os: parseOS(ua),
    deviceType: parseDeviceType(ua),
    userAgent: ua,
    screenResolution: typeof window !== 'undefined'
      ? `${window.screen.width}x${window.screen.height}`
      : 'unknown',
  };
}

/**
 * Serialize device info to a JSON string for the x-device-info header.
 */
export function getDeviceInfoHeader(): string {
  return JSON.stringify(getDeviceInfo());
}

function parseBrowser(ua: string): string {
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera';
  return 'Unknown';
}

function parseOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

function parseDeviceType(ua: string): string {
  if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android')) return 'Mobile';
  if (ua.includes('iPad') || ua.includes('Tablet')) return 'Tablet';
  return 'Desktop';
}