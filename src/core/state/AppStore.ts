import { Store } from './Store.js';
import { AppState, Document, SortOption, ViewMode } from '../../types/index.js';

const initialState: AppState = {
  documents: [],
  isLoading: false,
  error: null,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  viewMode: 'list'
};

export class AppStore extends Store<AppState> {
  private static instance: AppStore;

  constructor() {
    super(initialState);
  }

  static getInstance(): AppStore {
    if (!AppStore.instance) {
      AppStore.instance = new AppStore();
    }
    return AppStore.instance;
  }

  setDocuments(documents: Document[]): void {
    this.setState({ documents, error: null });
  }

  addDocument(document: Document): void {
    const currentState = this.getState();
    const updatedDocuments = [document, ...currentState.documents];
    this.setState({ documents: updatedDocuments });
  }

  setLoading(isLoading: boolean): void {
    this.setState({ isLoading });
  }

  setError(error: string | null): void {
    this.setState({ error, isLoading: false });
  }

  setSortBy(sortBy: SortOption): void {
    this.setState({ sortBy });
  }

  setSortOrder(sortOrder: 'asc' | 'desc'): void {
    this.setState({ sortOrder });
  }

  setViewMode(viewMode: ViewMode): void {
    this.setState({ viewMode });
  }

  toggleViewMode(): void {
    const currentState = this.getState();
    const newViewMode = currentState.viewMode === 'list' ? 'grid' : 'list';
    this.setState({ viewMode: newViewMode });
  }

  clearError(): void {
    this.setState({ error: null });
  }

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
}