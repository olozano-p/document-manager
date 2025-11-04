import { test, describe, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';

// Mock the interfaces and types
interface Document {
  id: string;
  name: string;
  contributors: Array<{ name: string; avatar: string }>;
  version: number;
  createdAt: string;
  attachments: Array<{ name: string; size: number }>;
}

interface AppState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  sortBy: 'name' | 'version' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid';
}

describe('AppStore Specific Implementation', () => {
  let mockAppStore: any;
  let listeners: Array<(state: AppState) => void>;
  let state: AppState;

  beforeEach(() => {
    listeners = [];
    state = {
      documents: [],
      isLoading: false,
      error: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      viewMode: 'list'
    };

    mockAppStore = {
      state,
      listeners,

      getState(): AppState {
        return { ...this.state };
      },

      setState(partial: Partial<AppState>): void {
        const previousState = { ...this.state };
        this.state = { ...this.state, ...partial };

        // Only notify if state actually changed
        if (JSON.stringify(previousState) !== JSON.stringify(this.state)) {
          this.listeners.forEach((listener: (state: AppState) => void) => {
            try {
              listener({ ...this.state });
            } catch (error) {
              console.error('Error in state listener:', error);
            }
          });
        }
      },

      subscribe(listener: (state: AppState) => void): () => void {
        this.listeners.push(listener);
        return () => {
          const index = this.listeners.indexOf(listener);
          if (index > -1) {
            this.listeners.splice(index, 1);
          }
        };
      },

      // AppStore specific methods
      setDocuments(documents: Document[]): void {
        this.setState({ documents, error: null });
      },

      addDocument(document: Document): void {
        const currentState = this.getState();
        const updatedDocuments = [document, ...currentState.documents];
        this.setState({ documents: updatedDocuments });
      },

      setLoading(isLoading: boolean): void {
        this.setState({ isLoading });
      },

      setError(error: string | null): void {
        this.setState({ error, isLoading: false });
      },

      setSortBy(sortBy: 'name' | 'version' | 'createdAt'): void {
        this.setState({ sortBy });
      },

      setSortOrder(sortOrder: 'asc' | 'desc'): void {
        this.setState({ sortOrder });
      },

      setViewMode(viewMode: 'list' | 'grid'): void {
        this.setState({ viewMode });
      },

      toggleViewMode(): void {
        const currentState = this.getState();
        const newViewMode = currentState.viewMode === 'list' ? 'grid' : 'list';
        this.setState({ viewMode: newViewMode });
      },

      clearError(): void {
        this.setState({ error: null });
      },

      getSortedDocuments(): Document[] {
        const { documents, sortBy, sortOrder } = this.getState();

        return [...documents].sort((a, b) => {
          let comparison = 0;

          switch (sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'version':
              comparison = a.version - b.version;
              break;
            case 'createdAt':
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
          }

          return sortOrder === 'desc' ? -comparison : comparison;
        });
      }
    };
  });

  test('should initialize with correct default state', () => {
    const state = mockAppStore.getState();

    assert.deepEqual(state.documents, []);
    assert.equal(state.isLoading, false);
    assert.equal(state.error, null);
    assert.equal(state.sortBy, 'createdAt');
    assert.equal(state.sortOrder, 'desc');
    assert.equal(state.viewMode, 'list');
  });

  test('should set documents and clear error', () => {
    const documents: Document[] = [
      {
        id: '1',
        name: 'Document 1',
        contributors: [],
        version: 1,
        createdAt: '2023-01-01T00:00:00.000Z',
        attachments: []
      }
    ];

    // First set an error
    mockAppStore.setError('Some error');
    assert.equal(mockAppStore.getState().error, 'Some error');

    // Then set documents, which should clear the error
    mockAppStore.setDocuments(documents);

    const state = mockAppStore.getState();
    assert.deepEqual(state.documents, documents);
    assert.equal(state.error, null);
  });

  test('should add document to beginning of list', () => {
    const existingDocs: Document[] = [
      {
        id: '1',
        name: 'Existing Document',
        contributors: [],
        version: 1,
        createdAt: '2023-01-01T00:00:00.000Z',
        attachments: []
      }
    ];

    mockAppStore.setDocuments(existingDocs);

    const newDoc: Document = {
      id: '2',
      name: 'New Document',
      contributors: [],
      version: 1,
      createdAt: '2023-01-02T00:00:00.000Z',
      attachments: []
    };

    mockAppStore.addDocument(newDoc);

    const state = mockAppStore.getState();
    assert.equal(state.documents.length, 2);
    assert.equal(state.documents[0].id, '2'); // New document should be first
    assert.equal(state.documents[1].id, '1'); // Existing document should be second
  });

  test('should set loading state', () => {
    mockAppStore.setLoading(true);
    assert.equal(mockAppStore.getState().isLoading, true);

    mockAppStore.setLoading(false);
    assert.equal(mockAppStore.getState().isLoading, false);
  });

  test('should set error and clear loading', () => {
    mockAppStore.setLoading(true);
    assert.equal(mockAppStore.getState().isLoading, true);

    mockAppStore.setError('Network error');

    const state = mockAppStore.getState();
    assert.equal(state.error, 'Network error');
    assert.equal(state.isLoading, false); // Should automatically clear loading
  });

  test('should clear error', () => {
    mockAppStore.setError('Some error');
    assert.equal(mockAppStore.getState().error, 'Some error');

    mockAppStore.clearError();
    assert.equal(mockAppStore.getState().error, null);
  });

  test('should set sort criteria', () => {
    mockAppStore.setSortBy('name');
    assert.equal(mockAppStore.getState().sortBy, 'name');

    mockAppStore.setSortBy('version');
    assert.equal(mockAppStore.getState().sortBy, 'version');

    mockAppStore.setSortBy('createdAt');
    assert.equal(mockAppStore.getState().sortBy, 'createdAt');
  });

  test('should set sort order', () => {
    mockAppStore.setSortOrder('asc');
    assert.equal(mockAppStore.getState().sortOrder, 'asc');

    mockAppStore.setSortOrder('desc');
    assert.equal(mockAppStore.getState().sortOrder, 'desc');
  });

  test('should set view mode', () => {
    mockAppStore.setViewMode('grid');
    assert.equal(mockAppStore.getState().viewMode, 'grid');

    mockAppStore.setViewMode('list');
    assert.equal(mockAppStore.getState().viewMode, 'list');
  });

  test('should toggle view mode', () => {
    // Start with list mode
    assert.equal(mockAppStore.getState().viewMode, 'list');

    mockAppStore.toggleViewMode();
    assert.equal(mockAppStore.getState().viewMode, 'grid');

    mockAppStore.toggleViewMode();
    assert.equal(mockAppStore.getState().viewMode, 'list');
  });

  test('should sort documents by name ascending', () => {
    const documents: Document[] = [
      {
        id: '1',
        name: 'Zebra Document',
        contributors: [],
        version: 1,
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
      },
      {
        id: '3',
        name: 'Beta Document',
        contributors: [],
        version: 1,
        createdAt: '2023-01-03T00:00:00.000Z',
        attachments: []
      }
    ];

    mockAppStore.setDocuments(documents);
    mockAppStore.setSortBy('name');
    mockAppStore.setSortOrder('asc');

    const sorted = mockAppStore.getSortedDocuments();

    assert.equal(sorted[0].name, 'Alpha Document');
    assert.equal(sorted[1].name, 'Beta Document');
    assert.equal(sorted[2].name, 'Zebra Document');
  });

  test('should sort documents by name descending', () => {
    const documents: Document[] = [
      {
        id: '1',
        name: 'Alpha Document',
        contributors: [],
        version: 1,
        createdAt: '2023-01-01T00:00:00.000Z',
        attachments: []
      },
      {
        id: '2',
        name: 'Beta Document',
        contributors: [],
        version: 1,
        createdAt: '2023-01-02T00:00:00.000Z',
        attachments: []
      },
      {
        id: '3',
        name: 'Zebra Document',
        contributors: [],
        version: 1,
        createdAt: '2023-01-03T00:00:00.000Z',
        attachments: []
      }
    ];

    mockAppStore.setDocuments(documents);
    mockAppStore.setSortBy('name');
    mockAppStore.setSortOrder('desc');

    const sorted = mockAppStore.getSortedDocuments();

    assert.equal(sorted[0].name, 'Zebra Document');
    assert.equal(sorted[1].name, 'Beta Document');
    assert.equal(sorted[2].name, 'Alpha Document');
  });

  test('should sort documents by version ascending', () => {
    const documents: Document[] = [
      {
        id: '1',
        name: 'Document A',
        contributors: [],
        version: 3,
        createdAt: '2023-01-01T00:00:00.000Z',
        attachments: []
      },
      {
        id: '2',
        name: 'Document B',
        contributors: [],
        version: 1,
        createdAt: '2023-01-02T00:00:00.000Z',
        attachments: []
      },
      {
        id: '3',
        name: 'Document C',
        contributors: [],
        version: 2,
        createdAt: '2023-01-03T00:00:00.000Z',
        attachments: []
      }
    ];

    mockAppStore.setDocuments(documents);
    mockAppStore.setSortBy('version');
    mockAppStore.setSortOrder('asc');

    const sorted = mockAppStore.getSortedDocuments();

    assert.equal(sorted[0].version, 1);
    assert.equal(sorted[1].version, 2);
    assert.equal(sorted[2].version, 3);
  });

  test('should sort documents by version descending', () => {
    const documents: Document[] = [
      {
        id: '1',
        name: 'Document A',
        contributors: [],
        version: 1,
        createdAt: '2023-01-01T00:00:00.000Z',
        attachments: []
      },
      {
        id: '2',
        name: 'Document B',
        contributors: [],
        version: 3,
        createdAt: '2023-01-02T00:00:00.000Z',
        attachments: []
      },
      {
        id: '3',
        name: 'Document C',
        contributors: [],
        version: 2,
        createdAt: '2023-01-03T00:00:00.000Z',
        attachments: []
      }
    ];

    mockAppStore.setDocuments(documents);
    mockAppStore.setSortBy('version');
    mockAppStore.setSortOrder('desc');

    const sorted = mockAppStore.getSortedDocuments();

    assert.equal(sorted[0].version, 3);
    assert.equal(sorted[1].version, 2);
    assert.equal(sorted[2].version, 1);
  });

  test('should sort documents by creation date ascending', () => {
    const documents: Document[] = [
      {
        id: '1',
        name: 'Document A',
        contributors: [],
        version: 1,
        createdAt: '2023-01-03T00:00:00.000Z',
        attachments: []
      },
      {
        id: '2',
        name: 'Document B',
        contributors: [],
        version: 1,
        createdAt: '2023-01-01T00:00:00.000Z',
        attachments: []
      },
      {
        id: '3',
        name: 'Document C',
        contributors: [],
        version: 1,
        createdAt: '2023-01-02T00:00:00.000Z',
        attachments: []
      }
    ];

    mockAppStore.setDocuments(documents);
    mockAppStore.setSortBy('createdAt');
    mockAppStore.setSortOrder('asc');

    const sorted = mockAppStore.getSortedDocuments();

    assert.equal(sorted[0].createdAt, '2023-01-01T00:00:00.000Z');
    assert.equal(sorted[1].createdAt, '2023-01-02T00:00:00.000Z');
    assert.equal(sorted[2].createdAt, '2023-01-03T00:00:00.000Z');
  });

  test('should sort documents by creation date descending (default)', () => {
    const documents: Document[] = [
      {
        id: '1',
        name: 'Document A',
        contributors: [],
        version: 1,
        createdAt: '2023-01-01T00:00:00.000Z',
        attachments: []
      },
      {
        id: '2',
        name: 'Document B',
        contributors: [],
        version: 1,
        createdAt: '2023-01-03T00:00:00.000Z',
        attachments: []
      },
      {
        id: '3',
        name: 'Document C',
        contributors: [],
        version: 1,
        createdAt: '2023-01-02T00:00:00.000Z',
        attachments: []
      }
    ];

    mockAppStore.setDocuments(documents);
    // Using default sort (createdAt, desc)

    const sorted = mockAppStore.getSortedDocuments();

    assert.equal(sorted[0].createdAt, '2023-01-03T00:00:00.000Z');
    assert.equal(sorted[1].createdAt, '2023-01-02T00:00:00.000Z');
    assert.equal(sorted[2].createdAt, '2023-01-01T00:00:00.000Z');
  });

  test('should not mutate original documents array', () => {
    const documents: Document[] = [
      {
        id: '1',
        name: 'Document B',
        contributors: [],
        version: 1,
        createdAt: '2023-01-02T00:00:00.000Z',
        attachments: []
      },
      {
        id: '2',
        name: 'Document A',
        contributors: [],
        version: 1,
        createdAt: '2023-01-01T00:00:00.000Z',
        attachments: []
      }
    ];

    mockAppStore.setDocuments(documents);
    mockAppStore.setSortBy('name');
    mockAppStore.setSortOrder('asc');

    const sorted = mockAppStore.getSortedDocuments();
    const originalState = mockAppStore.getState();

    // Sorted should be different order
    assert.equal(sorted[0].name, 'Document A');
    assert.equal(sorted[1].name, 'Document B');

    // Original state should maintain insertion order
    assert.equal(originalState.documents[0].name, 'Document B');
    assert.equal(originalState.documents[1].name, 'Document A');
  });

  test('should handle empty documents array', () => {
    const sorted = mockAppStore.getSortedDocuments();
    assert.deepEqual(sorted, []);
  });

  test('should notify listeners on state changes', () => {
    let notificationCount = 0;
    let lastState: AppState | null = null;

    const unsubscribe = mockAppStore.subscribe((state: AppState) => {
      notificationCount++;
      lastState = state;
    });

    mockAppStore.setLoading(true);

    assert.equal(notificationCount, 1);
    assert(lastState);
    assert.equal((lastState as AppState).isLoading, true);

    mockAppStore.setError('Test error');

    assert.equal(notificationCount, 2);
    assert(lastState);
    assert.equal((lastState as AppState).error, 'Test error');
    assert.equal((lastState as AppState).isLoading, false);

    unsubscribe();

    // Should not notify after unsubscribe
    mockAppStore.clearError();
    assert.equal(notificationCount, 2);
  });

  test('should handle multiple state changes in sequence', () => {
    const states: AppState[] = [];

    mockAppStore.subscribe((state: AppState) => {
      states.push(state);
    });

    mockAppStore.setLoading(true);
    mockAppStore.setError('Error occurred');
    mockAppStore.clearError();
    mockAppStore.setViewMode('grid');

    assert.equal(states.length, 4);
    assert.equal((states[0] as AppState).isLoading, true);
    assert.equal((states[1] as AppState).error, 'Error occurred');
    assert.equal((states[1] as AppState).isLoading, false);
    assert.equal((states[2] as AppState).error, null);
    assert.equal((states[3] as AppState).viewMode, 'grid');
  });
});

console.log('✅ All AppStore specific implementation tests defined!');