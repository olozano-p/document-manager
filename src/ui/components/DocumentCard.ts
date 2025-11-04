import { Document } from '../../types/index.js';
import { createSVGIcon, formatFileSize, formatRelativeDate } from '../utils/dom.js';

export class DocumentCard extends HTMLElement {
  private document: Document | null = null;
  private isGridMode = false;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  setDocument(document: Document) {
    this.document = document;
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


  private render() {
    if (!this.document) return;

    const { name, contributors = [], version, createdAt, attachments = [] } = this.document;

    this.innerHTML = `

      <div class="card">
        <div class="document-icon">
          ${createSVGIcon('document', this.isGridMode ? 24 : 20).outerHTML}
        </div>

        <div class="content">
          <h3 class="title" title="${name}">${name}</h3>

          <div class="meta">
            ${contributors.length > 0 ? `
              <div class="meta-item contributors tooltip">
                ${contributors.slice(0, 3).map(contributor =>
                  contributor.avatar
                    ? `<img src="${contributor.avatar}" alt="${contributor.name}" class="contributor-avatar" />`
                    : `<div class="contributor-avatar">${contributor.name.charAt(0).toUpperCase()}</div>`
                ).join('')}
                ${contributors.length > 3 ? `<span>+${contributors.length - 3}</span>` : ''}
                <div class="tooltip-content">
                  <strong>Contributors:</strong><br>
                  <ul class="contributor-list">
                    ${contributors.map(contributor => `<li>${contributor.name}</li>`).join('')}
                  </ul>
                </div>
              </div>
            ` : ''}

            <div class="meta-item">
              <span class="version-badge">v${version}</span>
            </div>

            ${attachments.length > 0 ? `
              <div class="meta-item attachments tooltip">
                ${createSVGIcon('attachment', 14).outerHTML}
                <span>${attachments.length} ${attachments.length === 1 ? 'file' : 'files'}</span>
                <span>(${formatFileSize(attachments.reduce((sum, att) => sum + att.size, 0))})</span>
                <div class="tooltip-content">
                  <strong>Attachments:</strong><br>
                  <ul class="attachment-list">
                    ${attachments.map(attachment =>
                      `<li>
                        <span>${attachment.name}</span>
                        <span>${formatFileSize(attachment.size)}</span>
                      </li>`
                    ).join('')}
                  </ul>
                </div>
              </div>
            ` : ''}

            <div class="meta-item">
              <span>${formatRelativeDate(createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('document-card', DocumentCard);