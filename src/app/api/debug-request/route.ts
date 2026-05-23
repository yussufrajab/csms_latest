import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function PATCH(req: Request) {
 if (process.env.NODE_ENV === 'production') {
 return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
 }
 logger.info(' PATCH request received!');
 const body = await req.json();
 logger.info({ value: body }, 'Body');
 return NextResponse.json({ success: true, message: 'PATCH works', body });
}

export async function PUT(req: Request) {
 if (process.env.NODE_ENV === 'production') {
 return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
 }
 logger.info(' PUT request received!');
 const body = await req.json();
 logger.info({ value: body }, 'Body');
 return NextResponse.json({ success: true, message: 'PUT works', body });
}
