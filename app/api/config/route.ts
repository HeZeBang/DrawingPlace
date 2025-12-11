import { NextResponse } from 'next/server';
import { getRuntimeConfig } from '@/lib/runtime-config';

export async function GET() {
  try {
    const config = getRuntimeConfig();
    
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Failed to get runtime config:', error);
    return NextResponse.json(
      { error: 'Failed to get runtime config' },
      { status: 500 }
    );
  }
}