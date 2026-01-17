import { DurableObject } from 'cloudflare:workers';

export interface Env {
  ROOM: DurableObjectNamespace;
  IMAGES: R2Bucket;
}

interface RoomMeta {
  id: string;
  template: string;
  adminToken: string;
  createdAt: string;
}

// Public meta excludes admin token for client-side state
interface PublicRoomMeta {
  id: string;
  template: string;
  createdAt: string;
}

interface Column {
  id: string;
  name: string;
  description: string;
  position: number;
}

interface Card {
  id: string;
  columnId: string;
  text: string;
  authorId: string;
  isPublished: boolean;
  createdAt: string;
}

const TEMPLATES: Record<string, Array<{ name: string; description: string }>> = {
  'mad-sad-glad': [
    { name: 'Mad', description: 'What made you frustrated?' },
    { name: 'Sad', description: 'What made you feel down?' },
    { name: 'Glad', description: 'What made you happy?' },
  ],
  'start-stop-continue': [
    { name: 'Start', description: 'What should we start doing?' },
    { name: 'Stop', description: 'What should we stop doing?' },
    { name: 'Continue', description: 'What should we continue doing?' },
  ],
  'liked-learned-lacked': [
    { name: 'Liked', description: 'What did you like?' },
    { name: 'Learned', description: 'What did you learn?' },
    { name: 'Lacked', description: 'What was lacking?' },
  ],
  blank: [],
};

interface SessionData {
  isAdmin: boolean;
  authorId: string;
}

export class Room extends DurableObject {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.initSchema();
  }

  private getSession(ws: WebSocket): SessionData | null {
    try {
      const attachment = ws.deserializeAttachment();
      if (attachment && typeof attachment === 'object') {
        return attachment as SessionData;
      }
    } catch {
      // No attachment
    }
    return null;
  }

  private initSchema(): void {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS room_meta (
        id TEXT PRIMARY KEY,
        template TEXT NOT NULL,
        admin_token TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS columns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        position INTEGER NOT NULL
      )
    `);

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        column_id TEXT NOT NULL,
        text TEXT NOT NULL,
        author_id TEXT NOT NULL,
        is_published INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (column_id) REFERENCES columns(id)
      )
    `);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Initialize room
    if (url.pathname === '/init' && request.method === 'POST') {
      const body = (await request.json()) as { template?: string };
      const template = body.template || 'mad-sad-glad';
      const adminToken = crypto.randomUUID();
      const roomId = crypto.randomUUID();

      this.sql.exec(
        `INSERT INTO room_meta (id, template, admin_token, created_at) VALUES (?, ?, ?, ?)`,
        roomId,
        template,
        adminToken,
        new Date().toISOString()
      );

      const templateColumns = TEMPLATES[template] || [];
      templateColumns.forEach((col, index) => {
        this.sql.exec(
          `INSERT INTO columns (id, name, description, position) VALUES (?, ?, ?, ?)`,
          crypto.randomUUID(),
          col.name,
          col.description,
          index
        );
      });

      return new Response(JSON.stringify({ adminToken }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];

      const urlParams = new URL(request.url).searchParams;
      const token = urlParams.get('token');
      const meta = this.getRoomMeta();
      const isAdmin = token === meta?.adminToken;
      const authorId = crypto.randomUUID();

      // Store session data as WebSocket attachment (survives hibernation)
      server.serializeAttachment({ isAdmin, authorId });

      this.ctx.acceptWebSocket(server);

      // Send initial state
      const state = this.getState(isAdmin, authorId);
      server.send(JSON.stringify({ type: 'sync', data: state }));

      return new Response(null, { status: 101, webSocket: client });
    }

    // Get room state (HTTP)
    if (request.method === 'GET') {
      const state = this.getState(false, '');
      return new Response(JSON.stringify(state), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  private getRoomMeta(): RoomMeta | null {
    const result = this.sql.exec(`SELECT * FROM room_meta LIMIT 1`).toArray();
    if (result.length === 0) return null;
    const row = result[0];
    return {
      id: row.id as string,
      template: row.template as string,
      adminToken: row.admin_token as string,
      createdAt: row.created_at as string,
    };
  }

  // Returns meta without admin token for sending to clients
  private getPublicMeta(): PublicRoomMeta | null {
    const meta = this.getRoomMeta();
    if (!meta) return null;
    return {
      id: meta.id,
      template: meta.template,
      createdAt: meta.createdAt,
    };
  }

  private getColumns(): Column[] {
    return this.sql
      .exec(`SELECT * FROM columns ORDER BY position`)
      .toArray()
      .map((row) => ({
        id: row.id as string,
        name: row.name as string,
        description: row.description as string,
        position: row.position as number,
      }));
  }

  private getCards(isAdmin: boolean, authorId: string): Card[] {
    const rows = this.sql.exec(`SELECT * FROM cards ORDER BY created_at`).toArray();
    return rows
      .filter((row) => {
        // Published cards are visible to everyone
        if (row.is_published) return true;
        // Unpublished cards: admin sees them (to know count) but author sees their own
        if (isAdmin) return true;
        if (row.author_id === authorId) return true;
        return false;
      })
      .map((row) => {
        const isOwnCard = row.author_id === authorId;
        const isPublished = Boolean(row.is_published);
        // Mask text for unpublished cards that aren't owned by the viewer
        // Admin can see there ARE cards but not read content until published
        const shouldMaskText = !isPublished && !isOwnCard;
        return {
          id: row.id as string,
          columnId: row.column_id as string,
          text: shouldMaskText ? '' : (row.text as string),
          authorId: row.author_id as string,
          isPublished,
          createdAt: row.created_at as string,
        };
      });
  }

  private getState(
    isAdmin: boolean,
    authorId: string
  ): { meta: PublicRoomMeta | null; columns: Column[]; cards: Card[]; isAdmin: boolean } {
    return {
      meta: this.getPublicMeta(),
      columns: this.getColumns(),
      cards: this.getCards(isAdmin, authorId),
      isAdmin,
    };
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    const session = this.getSession(ws);
    if (!session) return;

    try {
      const msg = JSON.parse(message as string) as {
        type: string;
        data: Record<string, unknown>;
      };

      switch (msg.type) {
        case 'card:add':
          // Anyone can add cards (they start unpublished)
          this.addCard(msg.data as { columnId: string; text: string }, session.authorId);
          break;
        case 'card:update':
          if (session.isAdmin) {
            this.updateCard(msg.data as { id: string; text: string });
          }
          break;
        case 'card:delete':
          if (session.isAdmin) {
            this.deleteCard(msg.data as { id: string });
          }
          break;
        case 'card:publish':
          if (session.isAdmin) {
            this.publishCard(msg.data as { id: string });
          }
          break;
        case 'card:publish-all':
          if (session.isAdmin) {
            this.publishAllCards(msg.data as { columnId: string });
          }
          break;
        case 'column:add':
          if (session.isAdmin) {
            this.addColumn(msg.data as { name: string; description: string });
          }
          break;
        case 'column:update':
          if (session.isAdmin) {
            this.updateColumn(msg.data as { id: string; name: string; description: string });
          }
          break;
        case 'column:delete':
          if (session.isAdmin) {
            this.deleteColumn(msg.data as { id: string });
          }
          break;
        case 'column:reorder':
          if (session.isAdmin) {
            this.reorderColumn(msg.data as { id: string; newPosition: number });
          }
          break;
      }

      this.broadcastState();
    } catch {
      // Ignore invalid messages
    }
  }

  webSocketClose(_ws: WebSocket): void {
    // Session data is automatically cleaned up with the WebSocket
  }

  webSocketError(_ws: WebSocket): void {
    // Session data is automatically cleaned up with the WebSocket
  }

  private addCard(data: { columnId: string; text: string }, authorId: string): void {
    this.sql.exec(
      `INSERT INTO cards (id, column_id, text, author_id, is_published, created_at) VALUES (?, ?, ?, ?, 0, ?)`,
      crypto.randomUUID(),
      data.columnId,
      data.text,
      authorId,
      new Date().toISOString()
    );
  }

  private updateCard(data: { id: string; text: string }): void {
    this.sql.exec(`UPDATE cards SET text = ? WHERE id = ?`, data.text, data.id);
  }

  private deleteCard(data: { id: string }): void {
    this.sql.exec(`DELETE FROM cards WHERE id = ?`, data.id);
  }

  private publishCard(data: { id: string }): void {
    this.sql.exec(`UPDATE cards SET is_published = 1 WHERE id = ?`, data.id);
  }

  private publishAllCards(data: { columnId: string }): void {
    this.sql.exec(`UPDATE cards SET is_published = 1 WHERE column_id = ?`, data.columnId);
  }

  private addColumn(data: { name: string; description: string }): void {
    // Get max position
    const result = this.sql.exec(`SELECT MAX(position) as max_pos FROM columns`).toArray();
    const maxPos = (result[0]?.max_pos as number | null) ?? -1;

    this.sql.exec(
      `INSERT INTO columns (id, name, description, position) VALUES (?, ?, ?, ?)`,
      crypto.randomUUID(),
      data.name,
      data.description,
      maxPos + 1
    );
  }

  private updateColumn(data: { id: string; name: string; description: string }): void {
    this.sql.exec(
      `UPDATE columns SET name = ?, description = ? WHERE id = ?`,
      data.name,
      data.description,
      data.id
    );
  }

  private deleteColumn(data: { id: string }): void {
    // Delete all cards in the column first
    this.sql.exec(`DELETE FROM cards WHERE column_id = ?`, data.id);
    // Delete the column
    this.sql.exec(`DELETE FROM columns WHERE id = ?`, data.id);
  }

  private reorderColumn(data: { id: string; newPosition: number }): void {
    // Get current position of the column
    const result = this.sql.exec(`SELECT position FROM columns WHERE id = ?`, data.id).toArray();
    if (result.length === 0) return;

    const currentPosition = result[0].position as number;
    const newPosition = data.newPosition;

    if (currentPosition === newPosition) return;

    if (currentPosition < newPosition) {
      // Moving down: shift columns between current+1 and new position up by 1
      this.sql.exec(
        `UPDATE columns SET position = position - 1 WHERE position > ? AND position <= ?`,
        currentPosition,
        newPosition
      );
    } else {
      // Moving up: shift columns between new position and current-1 down by 1
      this.sql.exec(
        `UPDATE columns SET position = position + 1 WHERE position >= ? AND position < ?`,
        newPosition,
        currentPosition
      );
    }

    // Set the new position for the moved column
    this.sql.exec(`UPDATE columns SET position = ? WHERE id = ?`, newPosition, data.id);
  }

  private broadcastState(): void {
    const webSockets = this.ctx.getWebSockets();
    for (const ws of webSockets) {
      try {
        const session = this.getSession(ws);
        if (session) {
          const state = this.getState(session.isAdmin, session.authorId);
          ws.send(JSON.stringify({ type: 'sync', data: state }));
        }
      } catch {
        // Ignore dead connections - they'll be cleaned up automatically
      }
    }
  }
}
