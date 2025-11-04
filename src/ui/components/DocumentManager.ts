import { DocumentService } from '../../core/services/DocumentService.js';
import { AppState, SortOption } from '../../types/index.js';
import { createSVGIcon, debounce } from '../utils/dom.js';
import { DocumentList } from './DocumentList.js';
import { NotificationBanner } from './NotificationBanner.js';
import { CreateDocumentModal } from './CreateDocumentModal.js';

export class DocumentManager extends HTMLElement {
  private documentService: DocumentService;
  private documentList?: DocumentList;
  private notificationBanner?: NotificationBanner;
  private createModal?: CreateDocumentModal;
  private unsubscribe?: () => void;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.documentService = DocumentService.getInstance();
  }

  async connectedCallback() {
    this.render();
    this.setupEventListeners();
    await this.initialize();
  }

  disconnectedCallback() {
    this.unsubscribe?.();
    this.documentService.destroy();
  }

  private async initialize() {
    this.documentList = this.shadowRoot!.querySelector('document-list') as DocumentList;
    this.notificationBanner = this.shadowRoot!.querySelector('notification-banner') as NotificationBanner;
    this.createModal = this.shadowRoot!.querySelector('create-document-modal') as CreateDocumentModal;

    this.unsubscribe = this.documentService.subscribeToStateChanges((state: AppState) => {
      this.updateUI(state);
    });

    this.documentList?.setLoading(true);

    try {
      await this.documentService.initialize();
      this.notificationBanner?.showNotification({
        message: 'Document manager initialized successfully',
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      this.notificationBanner?.showNotification({
        message: 'Failed to initialize document manager. Please check if the server is running.',
        type: 'error',
        duration: 8000
      });
    }
  }

  private setupEventListeners() {
    this.shadowRoot!.addEventListener('click', this.handleClick.bind(this));
    this.shadowRoot!.addEventListener('change', this.handleChange.bind(this));
  }

  private handleClick(e: Event) {
    const target = e.target as HTMLElement;

    if (target.closest('.create-button')) {
      this.openCreateModal();
    }

    if (target.closest('.refresh-button')) {
      this.refreshDocuments();
    }

    if (target.closest('.view-toggle')) {
      this.documentService.toggleViewMode();
    }
  }

  private handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;

    if (target.classList.contains('sort-select')) {
      const [sortBy, order] = target.value.split('-') as [SortOption, 'asc' | 'desc'];
      this.documentService.setSortCriteria(sortBy, order);
    }
  }

  private openCreateModal() {
    this.createModal?.open((name, contributors) => {
      const newDocument = this.documentService.createDocument(name, contributors);
      this.notificationBanner?.showNotification({
        message: `Document "${newDocument.name}" created successfully`,
        type: 'success',
        duration: 4000
      });
    });
  }

  private async refreshDocuments() {
    const refreshButton = this.shadowRoot!.querySelector('.refresh-button') as HTMLButtonElement;
    refreshButton.disabled = true;

    try {
      await this.documentService.refreshDocuments();
      this.notificationBanner?.showNotification({
        message: 'Documents refreshed successfully',
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      this.notificationBanner?.showNotification({
        message: 'Failed to refresh documents',
        type: 'error',
        duration: 5000
      });
    } finally {
      refreshButton.disabled = false;
    }
  }

  private updateUI(state: AppState) {
    const documents = this.documentService.getSortedDocuments();

    this.documentList?.setDocuments(documents);
    this.documentList?.setViewMode(state.viewMode === 'grid');
    this.documentList?.setLoading(state.isLoading);

    this.updateViewToggleButton(state.viewMode);
    this.updateSortSelect(state.sortBy, state.sortOrder);

    if (state.error) {
      this.notificationBanner?.showNotification({
        message: state.error,
        type: 'error',
        duration: 8000
      });
    }

    setTimeout(() => {
      this.documentList?.updated();
    }, 0);
  }

  private updateViewToggleButton(viewMode: 'list' | 'grid') {
    const toggleButton = this.shadowRoot!.querySelector('.view-toggle') as HTMLButtonElement;
    const icon = toggleButton?.querySelector('.toggle-icon');

    if (icon && toggleButton) {
      icon.innerHTML = viewMode === 'list'
        ? createSVGIcon('grid', 20).outerHTML
        : createSVGIcon('list', 20).outerHTML;

      toggleButton.title = viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view';
    }
  }

  private updateSortSelect(sortBy: SortOption, sortOrder: 'asc' | 'desc') {
    const sortSelect = this.shadowRoot!.querySelector('.sort-select') as HTMLSelectElement;
    if (sortSelect) {
      sortSelect.value = `${sortBy}-${sortOrder}`;
    }
  }

  private render() {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background: #f9fafb;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .title-section {
          flex: 1;
          min-width: 200px;
        }

        .main-title {
          margin: 0 0 4px 0;
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }

        .subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sort-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          color: #374151;
          background: white;
        }

        .sort-select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .button-secondary {
          background: white;
          color: #374151;
          border-color: #d1d5db;
        }

        .button-secondary:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .button-primary {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .button-primary:hover:not(:disabled) {
          background: #4338ca;
          border-color: #4338ca;
        }

        .main-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          min-height: 400px;
        }

        @media (max-width: 768px) {
          .container {
            padding: 12px;
          }

          .header {
            padding: 16px;
            margin-bottom: 16px;
          }

          .header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .controls {
            justify-content: stretch;
          }

          .controls > * {
            flex: 1;
            min-width: 120px;
          }

          .main-title {
            font-size: 24px;
          }

          .main-content {
            padding: 16px;
          }
        }
      </style>

      <div class="container">
        <header class="header">
          <div class="header-content">
            <div class="title-section">
              <h1 class="main-title">Document Manager</h1>
              <p class="subtitle">Manage and organize your documents</p>
            </div>

            <div class="controls">
              <select class="sort-select" aria-label="Sort documents">
                <option value="createdAt-desc">Newest first</option>
                <option value="createdAt-asc">Oldest first</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="version-desc">Version (high to low)</option>
                <option value="version-asc">Version (low to high)</option>
              </select>

              <button class="button button-secondary view-toggle" title="Switch view">
                <span class="toggle-icon">${createSVGIcon('grid', 20).outerHTML}</span>
              </button>

              <button class="button button-secondary refresh-button" title="Refresh documents">
                ${createSVGIcon('sort', 20).outerHTML}
                <span>Refresh</span>
              </button>

              <button class="button button-primary create-button">
                ${createSVGIcon('plus', 20).outerHTML}
                <span>New Document</span>
              </button>
            </div>
          </div>
        </header>

        <main class="main-content">
          <document-list></document-list>
        </main>
      </div>

      <notification-banner></notification-banner>
      <create-document-modal></create-document-modal>
    `;
  }
}

customElements.define('document-manager', DocumentManager);