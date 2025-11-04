import { Document } from '../../types/index.js';
import { createSVGIcon, formatFileSize, formatRelativeDate } from '../utils/dom.js';

export class DocumentCard extends HTMLElement {
  private document: Document | null = null;
  private isGridMode = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
    this.render();
  }

  private render() {
    if (!this.document) return;

    const { name, contributors = [], version, createdAt, attachments = [] } = this.document;

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .card {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: ${this.isGridMode ? '20px' : '16px'};
          transition: all 0.2s ease;
          cursor: pointer;
          height: ${this.isGridMode ? 'auto' : '80px'};
          display: flex;
          flex-direction: ${this.isGridMode ? 'column' : 'row'};
          align-items: ${this.isGridMode ? 'flex-start' : 'center'};
          gap: ${this.isGridMode ? '12px' : '16px'};
        }

        .card:hover {
          border-color: #4f46e5;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
        }

        .document-icon {
          flex-shrink: 0;
          color: #6b7280;
        }

        .content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .title {
          font-size: ${this.isGridMode ? '16px' : '14px'};
          font-weight: 600;
          color: #111827;
          margin: 0;
          white-space: ${this.isGridMode ? 'normal' : 'nowrap'};
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta {
          display: flex;
          flex-direction: ${this.isGridMode ? 'column' : 'row'};
          gap: ${this.isGridMode ? '8px' : '16px'};
          font-size: 12px;
          color: #6b7280;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .contributors {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .contributor-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f3f4f6;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #374151;
          font-weight: 500;
        }

        .version-badge {
          background: #f3f4f6;
          color: #374151;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .attachments {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Tooltip styles */
        .tooltip {
          position: relative;
          cursor: help;
        }

        .tooltip-content {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
          background: #1f2937;
          color: white;
          text-align: left;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          line-height: 1.4;
          white-space: nowrap;
          z-index: 1000;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: opacity 0.2s ease, visibility 0.2s ease;
          max-width: 300px;
          white-space: normal;
        }

        .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #1f2937;
        }

        .tooltip:hover .tooltip-content {
          visibility: visible;
          opacity: 1;
        }

        .contributor-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .contributor-list li {
          margin: 2px 0;
        }

        .attachment-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .attachment-list li {
          margin: 2px 0;
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .card {
            padding: 12px;
            height: auto;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .meta {
            flex-direction: column;
            gap: 6px;
          }
        }
      </style>

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