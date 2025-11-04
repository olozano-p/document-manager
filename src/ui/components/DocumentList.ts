import { Document } from '../../types/index.js';
import { DocumentCard } from './DocumentCard.js';

export class DocumentList extends HTMLElement {
  private documents: Document[] = [];
  private isGridMode = false;
  private isLoading = false;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  setDocuments(documents: Document[]) {
    this.documents = documents;
    this.render();
  }

  setViewMode(isGridMode: boolean) {
    this.isGridMode = isGridMode;
    // Update CSS class for grid mode styling
    if (isGridMode) {
      this.classList.add('grid-mode');
    } else {
      this.classList.remove('grid-mode');
    }
    this.render();
  }


  setLoading(isLoading: boolean) {
    this.isLoading = isLoading;
    this.render();
  }

  private render() {
    this.innerHTML = `

      <div class="container">
        ${this.renderContent()}
      </div>
    `;
  }

  private renderContent(): string {
    if (this.isLoading) {
      return `
        <div class="loading">
          <div class="loading-spinner"></div>
          <span>Loading documents...</span>
        </div>
      `;
    }

    if (this.documents.length === 0) {
      return `
        <div class="empty-state">
          <h3>No documents found</h3>
          <p>Start by creating your first document</p>
        </div>
      `;
    }

    const documentCards = this.documents.map(document => {
      return `<document-card data-document-id="${document.id}"></document-card>`;
    }).join('');

    return `
      <div class="documents-grid">
        ${documentCards}
      </div>
    `;
  }

  updated() {
    const cardElements = this.querySelectorAll('document-card') as NodeListOf<DocumentCard>;

    cardElements.forEach((card, index) => {
      const document = this.documents[index];
      if (document) {
        card.setDocument(document);
        card.setViewMode(this.isGridMode);
      }
    });
  }
}

customElements.define('document-list', DocumentList);