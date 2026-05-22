import { NextRequest, NextResponse } from 'next/server';
import { getHrimsApiConfig } from '@/lib/hrims-config';

function getCorsOrigin(request: NextRequest | Request): string {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  const origin = request.headers.get('origin') || '';
  return allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Get HRIMS config from environment/database (no hardcoded credentials)
    const hrimsConfig = await getHrimsApiConfig();

    const externalUrl = `${hrimsConfig.BASE_URL}/Employees`;

    console.log('Proxying request to HRIMS:', {
      url: externalUrl,
      requestId: body.RequestId,
      requestPayloadData: body.RequestPayloadData,
    });

    // Forward the request to the external API
    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        ApiKey: hrimsConfig.API_KEY,
        Token: hrimsConfig.TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`HRIMS API responded with status: ${response.status}`);
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('HRIMS API response received successfully');

    const corsOrigin = getCorsOrigin(req);
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error proxying to external API:', error);

    const corsOrigin = getCorsOrigin(req);
    return NextResponse.json(
      {
        error: 'Failed to fetch external employee data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  const corsOrigin = getCorsOrigin(req);
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
