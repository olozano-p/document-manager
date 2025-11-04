import { DocumentModel } from '../models/Document.js';
import { ApiService } from './ApiService.js';
import { WebSocketService } from './WebSocketService.js';
import { AppStore } from '../state/AppStore.js';
import { Document, Contributor, Attachment, WebSocketMessage, NotificationData } from '../../types/index.js';

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

  createDocument(name: string, contributors: Contributor[] = [], attachments: Attachment[] = []): DocumentModel {
    const newDocument = DocumentModel.createNew(name, contributors, attachments);
    this.store.addDocument(newDocument);
    return newDocument;
  }

  private setupWebSocketListeners(): void {
    this.wsUnsubscribe = this.wsService.onMessageReceived((message: WebSocketMessage) => {
      console.log('Document created by another user:', message.DocumentTitle, 'by', message.UserName);

      // Generate some mock contributors and attachments for WebSocket documents
      // to match the richness of API documents
      const contributors = [
        { name: message.UserName, avatar: '' }, // The actual creator
        ...Array.from({ length: Math.floor(Math.random() * 3) }, () => ({
          name: this.generateRandomName(),
          avatar: ''
        }))
      ];

      const attachments = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => ({
        name: this.generateRandomFileName(),
        size: Math.floor(Math.random() * 5000000) + 100000 // 100KB to 5MB
      }));

      const newDocument = new DocumentModel(
        message.DocumentID,
        message.DocumentTitle,
        contributors,
        1,
        message.Timestamp,
        attachments
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

  private generateRandomName(): string {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Cameron', 'Avery', 'Quinn', 'Sage'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson'];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${firstName} ${lastName}`;
  }

  private generateRandomFileName(): string {
    const prefixes = ['Project', 'Report', 'Document', 'Spec', 'Design', 'Analysis', 'Summary', 'Draft'];
    const suffixes = ['v1', 'v2', 'final', 'revised', 'updated', 'complete', 'draft', 'preliminary'];
    const extensions = ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'md'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const extension = extensions[Math.floor(Math.random() * extensions.length)];

    return `${prefix}_${suffix}.${extension}`;
  }
}