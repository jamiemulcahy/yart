export interface RoomMeta {
  id: string;
  template: string;
  createdAt: string;
}

export interface Column {
  id: string;
  name: string;
  description: string;
  position: number;
}

export interface Card {
  id: string;
  columnId: string;
  text: string;
  authorId: string;
  isPublished: boolean;
  createdAt: string;
}

export interface RoomState {
  meta: RoomMeta | null;
  columns: Column[];
  cards: Card[];
  isAdmin: boolean;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface RoomActions {
  addCard: (columnId: string, text: string) => void;
  updateCard: (id: string, text: string) => void;
  deleteCard: (id: string) => void;
  publishCard: (id: string) => void;
  publishAllCards: (columnId: string) => void;
  addColumn: (name: string, description: string) => void;
  updateColumn: (id: string, name: string, description: string) => void;
  deleteColumn: (id: string) => void;
  reorderColumn: (id: string, newPosition: number) => void;
}
