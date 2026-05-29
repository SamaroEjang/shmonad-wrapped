import { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const cleanHandle = handle.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');

  if (!cleanHandle) {
    return new Response('Invalid handle', { status: 400 });
  }

  const upstream = await fetch(`https://unavatar.io/twitter/${cleanHandle}`, {
    cache: 'no-store',
  });

  if (!upstream.ok || !upstream.body) {
    return new Response('Avatar not found', { status: 404 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
