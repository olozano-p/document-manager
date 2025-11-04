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
  private notificationUnsubscribe?: () => void;

  constructor() {
    super();
    this.documentService = DocumentService.getInstance();
  }

  async connectedCallback() {
    this.render();
    this.setupEventListeners();
    await this.initialize();
  }

  disconnectedCallback() {
    this.unsubscribe?.();
    this.notificationUnsubscribe?.();
    this.documentService.destroy();
  }


  private async initialize() {
    this.documentList = this.querySelector('document-list') as DocumentList;
    this.notificationBanner = this.querySelector('notification-banner') as NotificationBanner;
    this.createModal = this.querySelector('create-document-modal') as CreateDocumentModal;

    this.unsubscribe = this.documentService.subscribeToStateChanges((state: AppState) => {
      this.updateUI(state);
    });

    this.notificationUnsubscribe = this.documentService.onNotification((notification) => {
      this.notificationBanner?.showNotification(notification);
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
    this.addEventListener('click', this.handleClick.bind(this));
    this.addEventListener('change', this.handleChange.bind(this));
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
    this.createModal?.open((name, contributors, attachments) => {
      const newDocument = this.documentService.createDocument(name, contributors, attachments);
      this.notificationBanner?.showNotification({
        message: `Document "${newDocument.name}" created successfully`,
        type: 'success',
        duration: 4000
      });
    });
  }

  private async refreshDocuments() {
    const refreshButton = this.querySelector('.refresh-button') as HTMLButtonElement;
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
    const toggleButton = this.querySelector('.view-toggle') as HTMLButtonElement;
    const icon = toggleButton?.querySelector('.toggle-icon');

    if (icon && toggleButton) {
      icon.innerHTML = viewMode === 'list'
        ? createSVGIcon('grid', 20).outerHTML
        : createSVGIcon('list', 20).outerHTML;

      toggleButton.title = viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view';
    }
  }

  private updateSortSelect(sortBy: SortOption, sortOrder: 'asc' | 'desc') {
    const sortSelect = this.querySelector('.sort-select') as HTMLSelectElement;
    if (sortSelect) {
      sortSelect.value = `${sortBy}-${sortOrder}`;
    }
  }

  private render() {
    this.innerHTML = `

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