export interface Contributor {
  name: string;
  avatar: string;
}

export interface Attachment {
  name: string;
  size: number;
}

export interface Document {
  id: string;
  name: string;
  contributors: Contributor[];
  version: number;
  createdAt: string;
  attachments: Attachment[];
}

export interface AppState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  sortBy: 'name' | 'version' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid';
}

export interface NotificationData {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export interface WebSocketMessage {
  Timestamp: string;
  UserID: string;
  UserName: string;
  DocumentID: string;
  DocumentTitle: string;
}

export type SortOption = 'name' | 'version' | 'createdAt';
export type ViewMode = 'list' | 'grid';