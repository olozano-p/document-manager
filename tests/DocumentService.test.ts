import { test, describe, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';

// Mock the Document interface and related types
interface Document {
  id: string;
  name: string;
  contributors: Array<{ name: string; avatar: string }>;
  version: number;
  createdAt: string;
  attachments: Array<{ name: string; size: number }>;
}

interface WebSocketMessage {
  DocumentID: string;
  DocumentTitle: string;
  UserName: string;
  Timestamp: string;
}

interface NotificationData {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

describe('DocumentService Concepts', () => {
  let mockDocumentService: any;
  let mockApiService: any;
  let mockWebSocketService: any;
  let mockAppStore: any;
  let documentHandlers: Set<(message: WebSocketMessage) => void>;
  let notificationCallbacks: Set<(notification: NotificationData) => void>;

  beforeEach(() => {
    documentHandlers = new Set();
    notificationCallbacks = new Set();

    // Mock ApiService
    mockApiService = {
      fetchDocuments: async (): Promise<Document[]> => {
        return [
          {
            id: 'doc-1',
            name: 'Test Document',
            contributors: [{ name: 'John Doe', avatar: '' }],
            version: 1,
            createdAt: '2023-01-01T00:00:00.000Z',
            attachments: [{ name: 'test.pdf', size: 1024 }]
          }
        ];
      },
      isServerAvailable: async (): Promise<boolean> => true
    };

    // Mock WebSocketService
    mockWebSocketService = {
      url: 'ws://localhost:8080/notifications',
      connect: () => {},
      disconnect: () => {},
      onMessageReceived: (handler: (message: WebSocketMessage) => void) => {
        documentHandlers.add(handler);
        return () => documentHandlers.delete(handler);
      },
      getConnectionState: () => 'connected'
    };

    // Mock AppStore
    const storeState = {
      documents: [] as Document[],
      isLoading: false,
      error: null as string | null,
      sortBy: 'createdAt' as 'name' | 'version' | 'createdAt',
      sortOrder: 'desc' as 'asc' | 'desc',
      viewMode: 'list' as 'list' | 'grid'
    };

    mockAppStore = {
      getState: () => ({ ...storeState }),
      setDocuments: (documents: Document[]) => {
        storeState.documents = documents;
      },
      addDocument: (document: Document) => {
        storeState.documents.push(document);
      },
      setLoading: (loading: boolean) => {
        storeState.isLoading = loading;
      },
      setError: (error: string | null) => {
        storeState.error = error;
      },
      clearError: () => {
        storeState.error = null;
      },
      setSortBy: (sortBy: 'name' | 'version' | 'createdAt') => {
        storeState.sortBy = sortBy;
      },
      setSortOrder: (order: 'asc' | 'desc') => {
        storeState.sortOrder = order;
      },
      setViewMode: (viewMode: 'list' | 'grid') => {
        storeState.viewMode = viewMode;
      },
      toggleViewMode: () => {
        storeState.viewMode = storeState.viewMode === 'list' ? 'grid' : 'list';
      },
      getSortedDocuments: (): Document[] => {
        const docs = [...storeState.documents];
        return docs.sort((a, b) => {
          const aVal = a[storeState.sortBy];
          const bVal = b[storeState.sortBy];
          const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return storeState.sortOrder === 'asc' ? result : -result;
        });
      },
      subscribe: (callback: (state: any) => void) => {
        return () => {}; // Mock unsubscribe
      }
    };

    // Mock DocumentService
    mockDocumentService = {
      apiService: mockApiService,
      wsService: mockWebSocketService,
      store: mockAppStore,
      wsUnsubscribe: null as (() => void) | null,
      notificationCallbacks,

      async initialize() {
        try {
          await this.loadDocuments();
          this.setupWebSocketListeners();
          this.wsService.connect();
        } catch (error) {
          console.error('Failed to initialize DocumentService:', error);
          this.store.setError(error instanceof Error ? error.message : 'Initialization failed');
        }
      },

      async loadDocuments() {
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
      },

      async refreshDocuments() {
        return this.loadDocuments();
      },

      createDocument(name: string, contributors = [], attachments = []) {
        const newDocument = {
          id: crypto.randomUUID ? crypto.randomUUID() : 'mock-id-' + Date.now(),
          name,
          contributors,
          version: 1,
          createdAt: new Date().toISOString(),
          attachments
        };
        this.store.addDocument(newDocument);
        return newDocument;
      },

      setupWebSocketListeners() {
        this.wsUnsubscribe = this.wsService.onMessageReceived((message: WebSocketMessage) => {
          console.log('Document created by another user:', message.DocumentTitle, 'by', message.UserName);

          const contributors = [
            { name: message.UserName, avatar: '' },
            ...Array.from({ length: Math.floor(Math.random() * 3) }, () => ({
              name: this.generateRandomName(),
              avatar: ''
            }))
          ];

          const attachments = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => ({
            name: this.generateRandomFileName(),
            size: Math.floor(Math.random() * 5000000) + 100000
          }));

          const newDocument = {
            id: message.DocumentID,
            name: message.DocumentTitle,
            contributors,
            version: 1,
            createdAt: message.Timestamp,
            attachments
          };

          const existingDocuments = this.store.getState().documents;
          const exists = existingDocuments.some((d: Document) => d.id === message.DocumentID);

          if (!exists) {
            this.store.addDocument(newDocument);
            this.notifyCallbacks({
              message: `New document "${message.DocumentTitle}" created by ${message.UserName}`,
              type: 'info',
              duration: 5000
            });
          }
        });
      },

      destroy() {
        if (this.wsUnsubscribe) {
          this.wsUnsubscribe();
          this.wsUnsubscribe = null;
        }
        this.wsService.disconnect();
      },

      getSortedDocuments() {
        return this.store.getSortedDocuments();
      },

      setSortCriteria(sortBy: 'name' | 'version' | 'createdAt', order: 'asc' | 'desc' = 'desc') {
        this.store.setSortBy(sortBy);
        this.store.setSortOrder(order);
      },

      toggleViewMode() {
        this.store.toggleViewMode();
      },

      setViewMode(viewMode: 'list' | 'grid') {
        this.store.setViewMode(viewMode);
      },

      getAppState() {
        return this.store.getState();
      },

      subscribeToStateChanges(callback: (state: any) => void) {
        return this.store.subscribe(callback);
      },

      async isServerAvailable() {
        return this.apiService.isServerAvailable();
      },

      getWebSocketStatus() {
        return this.wsService.getConnectionState();
      },

      onNotification(callback: (notification: NotificationData) => void) {
        this.notificationCallbacks.add(callback);
        return () => this.notificationCallbacks.delete(callback);
      },

      notifyCallbacks(notification: NotificationData) {
        this.notificationCallbacks.forEach((callback: any) => {
          try {
            callback(notification);
          } catch (error) {
            console.error('Error in notification callback:', error);
          }
        });
      },

      generateRandomName() {
        const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan'];
        const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson'];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        return `${firstName} ${lastName}`;
      },

      generateRandomFileName() {
        const prefixes = ['Project', 'Report', 'Document', 'Spec', 'Design'];
        const suffixes = ['v1', 'v2', 'final', 'revised', 'updated'];
        const extensions = ['pdf', 'docx', 'xlsx', 'pptx', 'txt'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const extension = extensions[Math.floor(Math.random() * extensions.length)];
        return `${prefix}_${suffix}.${extension}`;
      }
    };
  });

  test('should initialize successfully', async () => {
    await mockDocumentService.initialize();

    const state = mockDocumentService.getAppState();
    assert.equal(state.documents.length, 1);
    assert.equal(state.documents[0].name, 'Test Document');
    assert.equal(state.isLoading, false);
    assert.equal(state.error, null);
  });

  test('should handle initialization errors', async () => {
    mockDocumentService.apiService.fetchDocuments = async () => {
      throw new Error('Network error');
    };

    await mockDocumentService.initialize();

    const state = mockDocumentService.getAppState();
    assert.equal(state.error, 'Network error');
    assert.equal(state.isLoading, false);
  });

  test('should load documents successfully', async () => {
    await mockDocumentService.loadDocuments();

    const state = mockDocumentService.getAppState();
    assert.equal(state.documents.length, 1);
    assert.equal(state.documents[0].id, 'doc-1');
    assert.equal(state.isLoading, false);
    assert.equal(state.error, null);
  });

  test('should handle document loading errors', async () => {
    mockDocumentService.apiService.fetchDocuments = async () => {
      throw new Error('API error');
    };

    await mockDocumentService.loadDocuments();

    const state = mockDocumentService.getAppState();
    assert.equal(state.error, 'API error');
    assert.equal(state.isLoading, false);
  });

  test('should refresh documents', async () => {
    await mockDocumentService.refreshDocuments();

    const state = mockDocumentService.getAppState();
    assert.equal(state.documents.length, 1);
  });

  test('should create new document', () => {
    const contributors = [{ name: 'Jane Doe', avatar: '' }];
    const attachments = [{ name: 'file.pdf', size: 2048 }];

    const document = mockDocumentService.createDocument('New Document', contributors, attachments);

    assert.equal(document.name, 'New Document');
    assert.equal(document.contributors.length, 1);
    assert.equal(document.contributors[0].name, 'Jane Doe');
    assert.equal(document.attachments.length, 1);
    assert.equal(document.version, 1);
    assert(document.id); // Should have an ID
    assert(document.createdAt); // Should have a timestamp

    const state = mockDocumentService.getAppState();
    assert.equal(state.documents.length, 1);
    assert.equal(state.documents[0].name, 'New Document');
  });

  test('should create document with default parameters', () => {
    const document = mockDocumentService.createDocument('Simple Document');

    assert.equal(document.name, 'Simple Document');
    assert.equal(document.contributors.length, 0);
    assert.equal(document.attachments.length, 0);
    assert.equal(document.version, 1);
  });

  test('should handle WebSocket messages and create documents', () => {
    mockDocumentService.setupWebSocketListeners();

    const message: WebSocketMessage = {
      DocumentID: 'ws-doc-1',
      DocumentTitle: 'WebSocket Document',
      UserName: 'Remote User',
      Timestamp: '2023-01-02T00:00:00.000Z'
    };

    let notificationReceived: NotificationData | null = null;
    mockDocumentService.onNotification((notification: NotificationData) => {
      notificationReceived = notification;
    });

    // Simulate WebSocket message
    documentHandlers.forEach(handler => handler(message));

    const state = mockDocumentService.getAppState();
    const newDoc = state.documents.find((d: Document) => d.id === 'ws-doc-1');

    assert(newDoc, 'Document should be added from WebSocket message');
    assert.equal(newDoc.name, 'WebSocket Document');
    assert.equal(newDoc.contributors[0].name, 'Remote User');
    assert(newDoc.attachments.length > 0, 'Should have generated attachments');

    assert(notificationReceived, 'Should receive notification');
    assert.equal((notificationReceived as NotificationData).type, 'info');
    assert((notificationReceived as NotificationData).message.includes('WebSocket Document'));
    assert((notificationReceived as NotificationData).message.includes('Remote User'));
  });

  test('should not duplicate documents from WebSocket', () => {
    mockDocumentService.setupWebSocketListeners();

    // Add a document first
    mockDocumentService.store.addDocument({
      id: 'existing-doc',
      name: 'Existing Document',
      contributors: [],
      version: 1,
      createdAt: '2023-01-01T00:00:00.000Z',
      attachments: []
    });

    const message: WebSocketMessage = {
      DocumentID: 'existing-doc',
      DocumentTitle: 'Existing Document',
      UserName: 'Remote User',
      Timestamp: '2023-01-02T00:00:00.000Z'
    };

    const initialCount = mockDocumentService.getAppState().documents.length;

    // Simulate WebSocket message with existing document ID
    documentHandlers.forEach(handler => handler(message));

    const finalCount = mockDocumentService.getAppState().documents.length;
    assert.equal(finalCount, initialCount, 'Should not add duplicate document');
  });

  test('should manage sort criteria', () => {
    mockDocumentService.setSortCriteria('name', 'asc');

    const state = mockDocumentService.getAppState();
    assert.equal(state.sortBy, 'name');
    assert.equal(state.sortOrder, 'asc');
  });

  test('should use default sort order', () => {
    mockDocumentService.setSortCriteria('version');

    const state = mockDocumentService.getAppState();
    assert.equal(state.sortBy, 'version');
    assert.equal(state.sortOrder, 'desc');
  });

  test('should toggle view mode', () => {
    const initialState = mockDocumentService.getAppState();
    const initialViewMode = initialState.viewMode;

    mockDocumentService.toggleViewMode();

    const newState = mockDocumentService.getAppState();
    const expectedViewMode = initialViewMode === 'list' ? 'grid' : 'list';
    assert.equal(newState.viewMode, expectedViewMode);
  });

  test('should set view mode explicitly', () => {
    mockDocumentService.setViewMode('grid');

    const state = mockDocumentService.getAppState();
    assert.equal(state.viewMode, 'grid');

    mockDocumentService.setViewMode('list');

    const state2 = mockDocumentService.getAppState();
    assert.equal(state2.viewMode, 'list');
  });

  test('should get sorted documents', () => {
    // Add multiple documents
    mockDocumentService.store.setDocuments([
      {
        id: '1',
        name: 'Beta Document',
        contributors: [],
        version: 2,
        createdAt: '2023-01-01T00:00:00.000Z',
        attachments: []
      },
      {
        id: '2',
        name: 'Alpha Document',
        contributors: [],
        version: 1,
        createdAt: '2023-01-02T00:00:00.000Z',
        attachments: []
      }
    ]);

    mockDocumentService.setSortCriteria('name', 'asc');
    const sortedByName = mockDocumentService.getSortedDocuments();
    assert.equal(sortedByName[0].name, 'Alpha Document');
    assert.equal(sortedByName[1].name, 'Beta Document');

    mockDocumentService.setSortCriteria('version', 'desc');
    const sortedByVersion = mockDocumentService.getSortedDocuments();
    assert.equal(sortedByVersion[0].version, 2);
    assert.equal(sortedByVersion[1].version, 1);
  });

  test('should check server availability', async () => {
    const isAvailable = await mockDocumentService.isServerAvailable();
    assert.equal(isAvailable, true);
  });

  test('should get WebSocket status', () => {
    const status = mockDocumentService.getWebSocketStatus();
    assert.equal(status, 'connected');
  });

  test('should manage notification callbacks', () => {
    let receivedNotifications: NotificationData[] = [];

    const unsubscribe = mockDocumentService.onNotification((notification: NotificationData) => {
      receivedNotifications.push(notification);
    });

    const testNotification: NotificationData = {
      message: 'Test notification',
      type: 'success',
      duration: 3000
    };

    mockDocumentService.notifyCallbacks(testNotification);

    assert.equal(receivedNotifications.length, 1);
    assert.equal(receivedNotifications[0].message, 'Test notification');
    assert.equal(receivedNotifications[0].type, 'success');

    // Test unsubscribe
    unsubscribe();
    mockDocumentService.notifyCallbacks(testNotification);

    assert.equal(receivedNotifications.length, 1); // Should not increase
  });

  test('should handle notification callback errors', () => {
    const errorCallback = () => {
      throw new Error('Callback error');
    };

    mockDocumentService.onNotification(errorCallback);

    // Should not throw when callback errors occur
    assert.doesNotThrow(() => {
      mockDocumentService.notifyCallbacks({
        message: 'Test',
        type: 'info'
      });
    });
  });

  test('should generate random names', () => {
    const name1 = mockDocumentService.generateRandomName();
    const name2 = mockDocumentService.generateRandomName();

    assert(name1.includes(' '), 'Should contain space between first and last name');
    assert(typeof name1 === 'string', 'Should return string');

    // Names could be the same due to randomness, but structure should be consistent
    assert(name1.split(' ').length === 2, 'Should have first and last name');
    assert(name2.split(' ').length === 2, 'Should have first and last name');
  });

  test('should generate random filenames', () => {
    const filename1 = mockDocumentService.generateRandomFileName();
    const filename2 = mockDocumentService.generateRandomFileName();

    assert(filename1.includes('_'), 'Should contain underscore');
    assert(filename1.includes('.'), 'Should contain file extension');
    assert(typeof filename1 === 'string', 'Should return string');

    const parts = filename1.split('.');
    assert(parts.length === 2, 'Should have name and extension');
    assert(parts[1].length > 0, 'Should have file extension');
  });

  test('should destroy service and clean up', () => {
    mockDocumentService.setupWebSocketListeners();
    assert(mockDocumentService.wsUnsubscribe, 'Should have WebSocket unsubscribe function');

    mockDocumentService.destroy();

    assert.equal(mockDocumentService.wsUnsubscribe, null, 'Should clear unsubscribe function');
  });

  test('should handle destroy when no WebSocket subscription exists', () => {
    assert.doesNotThrow(() => {
      mockDocumentService.destroy();
    });
  });
});

console.log('✅ All DocumentService concept tests defined!');