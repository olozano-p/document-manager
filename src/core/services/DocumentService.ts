import { DocumentModel } from '../models/Document.js';
import { ApiService } from './ApiService.js';
import { WebSocketService } from './WebSocketService.js';
import { AppStore } from '../state/AppStore.js';
import { Document, Contributor, WebSocketMessage, NotificationData } from '../../types/index.js';

export class DocumentService {
  private static instance: DocumentService;
  private apiService: ApiService;
  private wsService: WebSocketService;
  private store: AppStore;
  private wsUnsubscribe: (() => void) | null = null;
  private notificationCallbacks: Set<(notification: NotificationData) => void> = new Set();

  private constructor() {
    this.apiService = ApiService.getInstance();
    this.wsService = WebSocketService.getInstance();
    this.store = AppStore.getInstance();
  }

  static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadDocuments();
      this.setupWebSocketListeners();
      this.wsService.connect();
    } catch (error) {
      console.error('Failed to initialize DocumentService:', error);
      this.store.setError(error instanceof Error ? error.message : 'Initialization failed');
    }
  }

  async loadDocuments(): Promise<void> {
    try {
      this.store.setLoading(true);
      this.store.clearError();

      const documents = await this.apiService.fetchDocuments();
      this.store.setDocuments(documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
      this.store.setError(error instanceof Error ? error.message : 'Failed to load documents');
    } finally {
      this.store.setLoading(false);
    }
  }

  async refreshDocuments(): Promise<void> {
    return this.loadDocuments();
  }

  createDocument(name: string, contributors: Contributor[] = []): DocumentModel {
    const newDocument = DocumentModel.createNew(name, contributors);
    this.store.addDocument(newDocument);
    return newDocument;
  }

  private setupWebSocketListeners(): void {
    this.wsUnsubscribe = this.wsService.onMessageReceived((message: WebSocketMessage) => {
      console.log('Document created by another user:', message.DocumentTitle, 'by', message.UserName);

      const newDocument = new DocumentModel(
        message.DocumentID,
        message.DocumentTitle,
        [{ name: message.UserName, avatar: '' }],
        1,
        message.Timestamp,
        []
      );

      const existingDocuments = this.store.getState().documents;
      const exists = existingDocuments.some(d => d.id === message.DocumentID);

      if (!exists) {
        this.store.addDocument(newDocument);

        this.notifyCallbacks({
          message: `New document "${message.DocumentTitle}" created by ${message.UserName}`,
          type: 'info',
          duration: 5000
        });
      }
    });
  }

  destroy(): void {
    if (this.wsUnsubscribe) {
      this.wsUnsubscribe();
      this.wsUnsubscribe = null;
    }
    this.wsService.disconnect();
  }

  getSortedDocuments(): Document[] {
    return this.store.getSortedDocuments();
  }

  setSortCriteria(sortBy: 'name' | 'version' | 'createdAt', order: 'asc' | 'desc' = 'desc'): void {
    this.store.setSortBy(sortBy);
    this.store.setSortOrder(order);
  }

  toggleViewMode(): void {
    this.store.toggleViewMode();
  }

  setViewMode(viewMode: 'list' | 'grid'): void {
    this.store.setViewMode(viewMode);
  }

  getAppState() {
    return this.store.getState();
  }

  subscribeToStateChanges(callback: (state: any) => void): () => void {
    return this.store.subscribe(callback);
  }

  isServerAvailable(): Promise<boolean> {
    return this.apiService.isServerAvailable();
  }

  getWebSocketStatus(): string {
    return this.wsService.getConnectionState();
  }

  onNotification(callback: (notification: NotificationData) => void): () => void {
    this.notificationCallbacks.add(callback);
    return () => this.notificationCallbacks.delete(callback);
  }

  private notifyCallbacks(notification: NotificationData): void {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }
}