import { Document } from '../../types/index.js';
import { DocumentCard } from './DocumentCard.js';

export class DocumentList extends HTMLElement {
  private documents: Document[] = [];
  private isGridMode = false;
  private isLoading = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
    this.render();
  }

  setLoading(isLoading: boolean) {
    this.isLoading = isLoading;
    this.render();
  }

  private render() {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .container {
          min-height: 200px;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .documents-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: ${this.isGridMode ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr'};
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .documents-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      </style>

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
    const cardElements = this.shadowRoot!.querySelectorAll('document-card') as NodeListOf<DocumentCard>;

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