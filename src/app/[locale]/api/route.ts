import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = request.url;

  return NextResponse.json({
    message: 'Hello from the API',
    request: requestUrl,
  });
}
