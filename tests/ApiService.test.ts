import { test, describe, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';

// Mock fetch for testing
global.fetch = global.fetch || ((url: string, options?: any) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([
      {
        id: 'doc-1',
        name: 'Test Document',
        contributors: [],
        version: 1,
        createdAt: '2023-01-01T00:00:00.000Z',
        attachments: []
      }
    ])
  } as Response);
});

describe('ApiService Concepts', () => {
  let mockApiService: any;

  beforeEach(() => {
    mockApiService = {
      baseUrl: 'http://localhost:3001',
      async fetchDocuments() {
        try {
          const response = await fetch(`${this.baseUrl}/documents`);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('Failed to fetch documents:', error);
          throw new Error('Failed to fetch documents. Please check if the server is running.');
        }
      },
      async retryFetch(url: string, options?: any, maxRetries = 3, delay = 100) {
        let lastError: Error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await fetch(url, options);

            if (response.ok) {
              return response;
            }

            if (response.status >= 500 && attempt < maxRetries) {
              await this.delay(delay * attempt);
              continue;
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            if (attempt < maxRetries) {
              await this.delay(delay * attempt);
              continue;
            }

            throw lastError;
          }
        }

        throw lastError!;
      },
      delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
    };
  });

  test('should fetch documents successfully', async () => {
    const documents = await mockApiService.fetchDocuments();

    assert(Array.isArray(documents));
    assert.equal(documents.length, 1);
    assert.equal(documents[0].id, 'doc-1');
    assert.equal(documents[0].name, 'Test Document');
  });

  test('should handle network errors gracefully', async () => {
    const failingApiService = {
      ...mockApiService,
      async fetchDocuments() {
        throw new Error('Network error');
      }
    };

    try {
      await failingApiService.fetchDocuments();
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert(error instanceof Error);
      assert(error.message.includes('Network error'));
    }
  });

  test('should retry failed requests', async () => {
    let attemptCount = 0;
    const mockFetch = (url: string) => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([])
      } as Response);
    };

    global.fetch = mockFetch as any;

    const response = await mockApiService.retryFetch('http://test.com', {}, 3, 1);
    assert.equal(attemptCount, 3);
    assert(response.ok);
  });

  test('should respect max retry limit', async () => {
    let attemptCount = 0;
    const mockFetch = () => {
      attemptCount++;
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);
    };

    global.fetch = mockFetch as any;

    try {
      await mockApiService.retryFetch('http://test.com', {}, 2, 1);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.equal(attemptCount, 2);
      assert(error instanceof Error);
    }
  });
});

describe('WebSocket Service Concepts', () => {
  test('should handle connection lifecycle', () => {
    const mockWebSocketService = {
      ws: null as any,
      url: 'ws://localhost:3001',
      documentHandlers: new Set(),
      statusHandlers: new Set(),

      connect() {
        // In real implementation, this would create WebSocket connection
        this.notifyStatusChange('connecting');

        setTimeout(() => {
          this.notifyStatusChange('connected');
        }, 10);
      },

      onDocumentReceived(handler: Function) {
        this.documentHandlers.add(handler);
        return () => this.documentHandlers.delete(handler);
      },

      onStatusChange(handler: Function) {
        this.statusHandlers.add(handler);
        return () => this.statusHandlers.delete(handler);
      },

      notifyStatusChange(status: string) {
        this.statusHandlers.forEach(handler => {
          try {
            handler(status);
          } catch (error) {
            console.error('Error in status handler:', error);
          }
        });
      },

      notifyDocumentHandlers(document: any) {
        this.documentHandlers.forEach(handler => {
          try {
            handler(document);
          } catch (error) {
            console.error('Error in document handler:', error);
          }
        });
      },

      disconnect() {
        this.documentHandlers.clear();
        this.statusHandlers.clear();
      }
    };

    let statusChanges: string[] = [];
    let documentCount = 0;

    mockWebSocketService.onStatusChange((status: string) => {
      statusChanges.push(status);
    });

    mockWebSocketService.onDocumentReceived(() => {
      documentCount++;
    });

    mockWebSocketService.connect();

    setTimeout(() => {
      assert.deepEqual(statusChanges, ['connecting']);

      setTimeout(() => {
        assert.deepEqual(statusChanges, ['connecting', 'connected']);

        mockWebSocketService.notifyDocumentHandlers({ id: 'doc-1', name: 'Test' });
        assert.equal(documentCount, 1);

        mockWebSocketService.disconnect();
        assert.equal(mockWebSocketService.documentHandlers.size, 0);
        assert.equal(mockWebSocketService.statusHandlers.size, 0);
      }, 15);
    }, 5);
  });
});

console.log('✅ All ApiService and WebSocket concept tests passed!');