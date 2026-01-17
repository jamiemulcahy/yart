import { Room } from './room';

export { Room };

export interface Env {
  ROOM: DurableObjectNamespace;
  IMAGES: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API routes
    if (path === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Room routes will be handled by Durable Objects
    if (path.startsWith('/api/rooms')) {
      const roomIdMatch = path.match(/^\/api\/rooms\/([^/]+)/);

      // Create room
      if (path === '/api/rooms' && request.method === 'POST') {
        const roomId = crypto.randomUUID();
        const id = env.ROOM.idFromName(roomId);
        const stub = env.ROOM.get(id);

        const response = await stub.fetch(
          new Request(`http://internal/init`, {
            method: 'POST',
            body: request.body,
          })
        );

        const data = (await response.json()) as { adminToken: string };

        return new Response(JSON.stringify({ roomId, adminToken: data.adminToken }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Room-specific routes
      if (roomIdMatch) {
        const roomId = roomIdMatch[1];
        const id = env.ROOM.idFromName(roomId);
        const stub = env.ROOM.get(id);

        // WebSocket upgrade
        if (path.endsWith('/ws')) {
          return stub.fetch(request);
        }

        // Get room state
        if (request.method === 'GET') {
          return stub.fetch(request);
        }
      }
    }

    return new Response(JSON.stringify({ name: 'YART API', version: '0.1.0' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
