import { createSVGIcon } from '../utils/dom.js';
import { Contributor, Attachment } from '../../types/index.js';

export class CreateDocumentModal extends HTMLElement {
  private isOpen = false;
  private onSubmitCallback?: (name: string, contributors: Contributor[], attachments: Attachment[]) => void;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  open(onSubmit: (name: string, contributors: Contributor[], attachments: Attachment[]) => void) {
    this.onSubmitCallback = onSubmit;
    this.isOpen = true;
    this.render();

    setTimeout(() => {
      const nameInput = this.shadowRoot!.querySelector('#document-name') as HTMLInputElement;
      nameInput?.focus();
    }, 100);
  }

  close() {
    this.isOpen = false;
    this.render();
    this.onSubmitCallback = undefined;
  }

  private setupEventListeners() {
    this.shadowRoot!.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('modal-overlay')) {
        this.close();
      }

      if (target.classList.contains('close-button') || target.closest('.close-button')) {
        this.close();
      }

      if (target.classList.contains('cancel-button')) {
        this.close();
      }

      if (target.classList.contains('create-button')) {
        this.handleSubmit();
      }
    });

    this.shadowRoot!.addEventListener('keydown', (e) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Escape') {
        this.close();
      }
    });

    this.shadowRoot!.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  private handleSubmit() {
    const form = this.shadowRoot!.querySelector('#create-document-form') as HTMLFormElement;
    const formData = new FormData(form);

    const name = (formData.get('documentName') as string)?.trim();

    if (!name) {
      this.showError('Document name is required');
      return;
    }

    const contributorsText = (formData.get('contributors') as string)?.trim();
    const contributors: Contributor[] = [];

    if (contributorsText) {
      const contributorNames = contributorsText.split(',').map(name => name.trim()).filter(Boolean);
      contributors.push(...contributorNames.map(name => ({
        name,
        avatar: '' // No avatar upload in this simple implementation
      })));
    }

    // Process attachment files
    const attachmentFiles = formData.getAll('attachments') as File[];
    const attachments: Attachment[] = [];

    for (const file of attachmentFiles) {
      if (file && file.name) {
        attachments.push({
          name: file.name,
          size: file.size
        });
      }
    }

    this.onSubmitCallback?.(name, contributors, attachments);
    this.close();
  }

  private showError(message: string) {
    const errorEl = this.shadowRoot!.querySelector('.error-message') as HTMLElement;
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  private render() {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
          display: ${this.isOpen ? 'block' : 'none'};
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ${this.isOpen ? 'fadeIn 0.2s ease' : 'none'};
        }

        .modal {
          background: white;
          border-radius: 12px;
          padding: 0;
          width: 90%;
          max-width: 480px;
          max-height: 90vh;
          overflow: hidden;
          animation: ${this.isOpen ? 'slideIn 0.3s ease' : 'none'};
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #374151;
          background: #f3f4f6;
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          color: #111827;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .file-input {
          padding: 6px 8px;
        }

        .file-input::-webkit-file-upload-button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 4px 12px;
          margin-right: 12px;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
        }

        .file-input::-webkit-file-upload-button:hover {
          background: #e5e7eb;
        }

        .form-help {
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .error-message {
          display: none;
          margin-bottom: 16px;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 14px;
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .button {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid;
          transition: all 0.2s ease;
        }

        .button-secondary {
          background: white;
          color: #374151;
          border-color: #d1d5db;
        }

        .button-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .button-primary {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .button-primary:hover {
          background: #4338ca;
          border-color: #4338ca;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (max-width: 768px) {
          .modal {
            width: 95%;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      </style>

      <div class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Create New Document</h2>
            <button class="close-button" aria-label="Close modal">
              ${createSVGIcon('close', 20).outerHTML}
            </button>
          </div>

          <form class="modal-body" id="create-document-form">
            <div class="error-message"></div>

            <div class="form-group">
              <label class="form-label" for="document-name">Document Name *</label>
              <input
                type="text"
                id="document-name"
                name="documentName"
                class="form-input"
                placeholder="Enter document name"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="contributors">Contributors</label>
              <input
                type="text"
                id="contributors"
                name="contributors"
                class="form-input"
                placeholder="John Doe, Jane Smith, ..."
              />
              <div class="form-help">
                Optional. Enter contributor names separated by commas.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="attachments">Attachments</label>
              <input
                type="file"
                id="attachments"
                name="attachments"
                class="form-input file-input"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              />
              <div class="form-help">
                Optional. Select one or more files to attach to the document.
              </div>
            </div>
          </form>

          <div class="modal-footer">
            <button type="button" class="button button-secondary cancel-button">
              Cancel
            </button>
            <button type="submit" class="button button-primary create-button">
              Create Document
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('create-document-modal', CreateDocumentModal);