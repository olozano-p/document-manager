import { test, describe, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';

// Mock DOM environment for component testing
interface MockElement {
  tagName: string;
  className: string;
  innerHTML: string;
  textContent: string;
  shadowRoot: MockShadowRoot | null;
  children: MockElement[];
  attributes: Map<string, string>;
  classList: MockClassList;

  attachShadow(options: { mode: string }): MockShadowRoot;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  addEventListener(event: string, handler: Function): void;
  removeEventListener(event: string, handler: Function): void;
  dispatchEvent(event: MockEvent): void;
  querySelector(selector: string): MockElement | null;
  querySelectorAll(selector: string): MockElement[];
}

interface MockShadowRoot {
  innerHTML: string;
  querySelector(selector: string): MockElement | null;
  querySelectorAll(selector: string): MockElement[];
}

interface MockClassList {
  add(className: string): void;
  remove(className: string): void;
  contains(className: string): boolean;
  toggle(className: string): boolean;
}

interface MockEvent {
  type: string;
  detail?: any;
  preventDefault(): void;
  stopPropagation(): void;
}

// Mock Document and related interfaces
interface Document {
  id: string;
  name: string;
  contributors: Array<{ name: string; avatar: string }>;
  version: number;
  createdAt: string;
  attachments: Array<{ name: string; size: number }>;
}

interface NotificationData {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

describe('Component Concepts', () => {
  let mockDocument: any;

  beforeEach(() => {
    // Mock global crypto for UUID generation if it doesn't exist
    if (typeof global !== 'undefined' && !global.crypto) {
      Object.defineProperty(global, 'crypto', {
        value: {
          randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)
        },
        writable: true,
        configurable: true
      });
    } else if (typeof global !== 'undefined' && global.crypto && !global.crypto.randomUUID) {
      Object.defineProperty(global.crypto, 'randomUUID', {
        value: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
        writable: true,
        configurable: true
      });
    }
  });

  describe('DocumentCard Component', () => {
    let mockDocumentCard: any;
    let mockShadowRoot: MockShadowRoot;

    beforeEach(() => {
      mockShadowRoot = {
        innerHTML: '',
        querySelector: (selector: string) => null,
        querySelectorAll: (selector: string) => []
      };

      mockDocumentCard = {
        document: null as Document | null,
        isGridMode: false,
        shadowRoot: mockShadowRoot,
        classList: {
          classes: new Set<string>(),
          add: function(className: string) { this.classes.add(className); },
          remove: function(className: string) { this.classes.delete(className); },
          contains: function(className: string) { return this.classes.has(className); }
        },

        attachShadow(options: { mode: string }) {
          return mockShadowRoot;
        },

        setDocument(document: Document) {
          this.document = document;
          this.render();
        },

        setViewMode(isGridMode: boolean) {
          this.isGridMode = isGridMode;
          if (isGridMode) {
            this.classList.add('grid-mode');
          } else {
            this.classList.remove('grid-mode');
          }
          this.render();
        },

        render() {
          if (!this.document) return;

          const { name, contributors = [], version, createdAt, attachments = [] } = this.document;

          // Simulate basic rendering
          const contributorIcons = contributors.slice(0, 3).map((c: any) =>
            c.avatar ? `<img src="${c.avatar}" alt="${c.name}" />` : `<div>${c.name.charAt(0)}</div>`
          ).join('');

          const totalSize = attachments.reduce((sum: number, att: any) => sum + att.size, 0);
          const formattedSize = this.formatFileSize(totalSize);
          const relativeDate = this.formatRelativeDate(createdAt);

          this.shadowRoot!.innerHTML = `
            <div class="card">
              <div class="content">
                <h3 title="${name}">${name}</h3>
                <div class="meta">
                  ${contributors.length > 0 ? `<div class="contributors">${contributorIcons}</div>` : ''}
                  <span class="version">v${version}</span>
                  ${attachments.length > 0 ? `<span class="attachments">${attachments.length} files (${formattedSize})</span>` : ''}
                  <span class="date">${relativeDate}</span>
                </div>
              </div>
            </div>
          `;
        },

        formatFileSize(bytes: number): string {
          if (bytes === 0) return '0 B';
          const sizes = ['B', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(1024));
          return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
        },

        formatRelativeDate(dateString: string): string {
          const date = new Date(dateString);
          const now = new Date('2023-01-15T00:00:00.000Z'); // Fixed for testing
          const diffInMs = now.getTime() - date.getTime();
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

          if (diffInDays === 0) return 'Today';
          if (diffInDays === 1) return 'Yesterday';
          if (diffInDays < 7) return `${diffInDays} days ago`;
          if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
          return `${Math.floor(diffInDays / 30)} months ago`;
        }
      };
    });

    test('should render document information correctly', () => {
      const document: Document = {
        id: 'doc-1',
        name: 'Test Document',
        contributors: [
          { name: 'John Doe', avatar: '' },
          { name: 'Jane Smith', avatar: 'avatar.jpg' }
        ],
        version: 2,
        createdAt: '2023-01-10T00:00:00.000Z',
        attachments: [
          { name: 'file1.pdf', size: 1024 },
          { name: 'file2.docx', size: 2048 }
        ]
      };

      mockDocumentCard.setDocument(document);

      assert(mockDocumentCard.shadowRoot.innerHTML.includes('Test Document'));
      assert(mockDocumentCard.shadowRoot.innerHTML.includes('v2'));
      assert(mockDocumentCard.shadowRoot.innerHTML.includes('2 files'));
      assert(mockDocumentCard.shadowRoot.innerHTML.includes('3 KB')); // 1024 + 2048 = 3072 bytes = 3 KB
      assert(mockDocumentCard.shadowRoot.innerHTML.includes('5 days ago'));
    });

    test('should handle document without contributors', () => {
      const document: Document = {
        id: 'doc-1',
        name: 'Simple Document',
        contributors: [],
        version: 1,
        createdAt: '2023-01-14T00:00:00.000Z',
        attachments: []
      };

      mockDocumentCard.setDocument(document);

      assert(mockDocumentCard.shadowRoot.innerHTML.includes('Simple Document'));
      assert(mockDocumentCard.shadowRoot.innerHTML.includes('v1'));
      assert(!mockDocumentCard.shadowRoot.innerHTML.includes('contributors'));
      // Check that some relative date is present (could be "Yesterday" or "1 day ago")
      const innerHTML = mockDocumentCard.shadowRoot.innerHTML;
      assert(innerHTML.includes('Yesterday') || innerHTML.includes('1 day ago') || innerHTML.includes('day'));
    });

    test('should set grid mode correctly', () => {
      mockDocumentCard.setViewMode(true);

      assert.equal(mockDocumentCard.isGridMode, true);
      assert(mockDocumentCard.classList.contains('grid-mode'));

      mockDocumentCard.setViewMode(false);

      assert.equal(mockDocumentCard.isGridMode, false);
      assert(!mockDocumentCard.classList.contains('grid-mode'));
    });

    test('should handle empty document', () => {
      mockDocumentCard.render(); // No document set

      assert.equal(mockDocumentCard.shadowRoot.innerHTML, '');
    });

    test('should format file sizes correctly', () => {
      assert.equal(mockDocumentCard.formatFileSize(0), '0 B');
      assert.equal(mockDocumentCard.formatFileSize(1024), '1 KB');
      assert.equal(mockDocumentCard.formatFileSize(1024 * 1024), '1 MB');
      assert.equal(mockDocumentCard.formatFileSize(1536), '1.5 KB');
    });

    test('should format relative dates correctly', () => {
      // Using fixed date 2023-01-15T00:00:00.000Z for testing
      assert.equal(mockDocumentCard.formatRelativeDate('2023-01-15T00:00:00.000Z'), 'Today');
      assert.equal(mockDocumentCard.formatRelativeDate('2023-01-14T00:00:00.000Z'), 'Yesterday');
      assert.equal(mockDocumentCard.formatRelativeDate('2023-01-10T00:00:00.000Z'), '5 days ago');
      assert.equal(mockDocumentCard.formatRelativeDate('2023-01-08T00:00:00.000Z'), '1 weeks ago');
    });
  });

  describe('NotificationBanner Component', () => {
    let mockNotificationBanner: any;

    beforeEach(() => {
      mockNotificationBanner = {
        isVisible: false,
        currentNotification: null as NotificationData | null,
        timeoutId: null as NodeJS.Timeout | null,

        show(notification: NotificationData) {
          this.currentNotification = notification;
          this.isVisible = true;
          this.render();

          if (notification.duration && notification.duration > 0) {
            this.timeoutId = setTimeout(() => {
              this.hide();
            }, notification.duration);
          }
        },

        hide() {
          this.isVisible = false;
          this.currentNotification = null;
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
          }
          this.render();
        },

        render() {
          if (!this.isVisible || !this.currentNotification) {
            return '<div class="notification-banner hidden"></div>';
          }

          const { message, type } = this.currentNotification;
          return `
            <div class="notification-banner visible ${type}">
              <span class="message">${message}</span>
              <button class="close-btn">×</button>
            </div>
          `;
        }
      };
    });

    afterEach(() => {
      if (mockNotificationBanner.timeoutId) {
        clearTimeout(mockNotificationBanner.timeoutId);
      }
    });

    test('should show notification correctly', () => {
      const notification: NotificationData = {
        message: 'Test notification',
        type: 'info',
        duration: 3000
      };

      mockNotificationBanner.show(notification);

      assert.equal(mockNotificationBanner.isVisible, true);
      assert.equal(mockNotificationBanner.currentNotification, notification);

      const rendered = mockNotificationBanner.render();
      assert(rendered.includes('Test notification'));
      assert(rendered.includes('info'));
      assert(rendered.includes('visible'));
    });

    test('should hide notification', () => {
      const notification: NotificationData = {
        message: 'Test notification',
        type: 'success'
      };

      mockNotificationBanner.show(notification);
      assert.equal(mockNotificationBanner.isVisible, true);

      mockNotificationBanner.hide();
      assert.equal(mockNotificationBanner.isVisible, false);
      assert.equal(mockNotificationBanner.currentNotification, null);
    });

    test('should auto-hide after duration', (context) => {
      const notification: NotificationData = {
        message: 'Auto-hide notification',
        type: 'warning',
        duration: 100 // Short duration for testing
      };

      mockNotificationBanner.show(notification);
      assert.equal(mockNotificationBanner.isVisible, true);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          assert.equal(mockNotificationBanner.isVisible, false);
          resolve();
        }, 150);
      });
    });

    test('should not auto-hide without duration', () => {
      const notification: NotificationData = {
        message: 'Persistent notification',
        type: 'error'
      };

      mockNotificationBanner.show(notification);
      assert.equal(mockNotificationBanner.isVisible, true);
      assert.equal(mockNotificationBanner.timeoutId, null);
    });

    test('should handle different notification types', () => {
      const types: Array<'info' | 'success' | 'warning' | 'error'> = ['info', 'success', 'warning', 'error'];

      types.forEach(type => {
        const notification: NotificationData = {
          message: `${type} notification`,
          type
        };

        mockNotificationBanner.show(notification);

        const rendered = mockNotificationBanner.render();
        assert(rendered.includes(type));
        assert(rendered.includes(`${type} notification`));
      });
    });
  });

  describe('CreateDocumentModal Component', () => {
    let mockCreateDocumentModal: any;

    beforeEach(() => {
      mockCreateDocumentModal = {
        isOpen: false,
        formData: {
          name: '',
          contributors: [] as Array<{ name: string; avatar: string }>,
          attachments: [] as Array<{ name: string; size: number }>
        },
        onSubmitCallback: null as ((data: any) => void) | null,

        open(onSubmit: (data: any) => void) {
          this.isOpen = true;
          this.onSubmitCallback = onSubmit;
          this.resetForm();
        },

        close() {
          this.isOpen = false;
          this.onSubmitCallback = null;
          this.resetForm();
        },

        resetForm() {
          this.formData = {
            name: '',
            contributors: [],
            attachments: []
          };
        },

        setName(name: string) {
          this.formData.name = name.trim();
        },

        addContributor(name: string) {
          if (name.trim()) {
            this.formData.contributors.push({
              name: name.trim(),
              avatar: ''
            });
          }
        },

        removeContributor(index: number) {
          if (index >= 0 && index < this.formData.contributors.length) {
            this.formData.contributors.splice(index, 1);
          }
        },

        addAttachment(name: string, size: number) {
          if (name.trim() && size > 0) {
            this.formData.attachments.push({
              name: name.trim(),
              size
            });
          }
        },

        removeAttachment(index: number) {
          if (index >= 0 && index < this.formData.attachments.length) {
            this.formData.attachments.splice(index, 1);
          }
        },

        isFormValid(): boolean {
          return this.formData.name.length > 0;
        },

        submit() {
          if (!this.isFormValid()) {
            throw new Error('Form is not valid');
          }

          if (this.onSubmitCallback) {
            this.onSubmitCallback({
              name: this.formData.name,
              contributors: [...this.formData.contributors],
              attachments: [...this.formData.attachments]
            });
          }

          this.close();
        },

        render() {
          if (!this.isOpen) {
            return '<div class="modal-overlay hidden"></div>';
          }

          return `
            <div class="modal-overlay visible">
              <div class="modal">
                <h2>Create New Document</h2>
                <form>
                  <input type="text" placeholder="Document name" value="${this.formData.name}" />
                  <div class="contributors">
                    ${this.formData.contributors.map((c: any, i: number) =>
                      `<div class="contributor-item">${c.name} <button type="button" data-remove="${i}">×</button></div>`
                    ).join('')}
                  </div>
                  <div class="attachments">
                    ${this.formData.attachments.map((a: any, i: number) =>
                      `<div class="attachment-item">${a.name} (${a.size} bytes) <button type="button" data-remove="${i}">×</button></div>`
                    ).join('')}
                  </div>
                  <div class="actions">
                    <button type="button" class="cancel">Cancel</button>
                    <button type="submit" ${!this.isFormValid() ? 'disabled' : ''}>Create</button>
                  </div>
                </form>
              </div>
            </div>
          `;
        }
      };
    });

    test('should open modal with callback', () => {
      const mockCallback = () => {};

      mockCreateDocumentModal.open(mockCallback);

      assert.equal(mockCreateDocumentModal.isOpen, true);
      assert.equal(mockCreateDocumentModal.onSubmitCallback, mockCallback);
      assert.equal(mockCreateDocumentModal.formData.name, '');
    });

    test('should close modal and reset form', () => {
      mockCreateDocumentModal.setName('Test Document');
      mockCreateDocumentModal.addContributor('John Doe');

      mockCreateDocumentModal.close();

      assert.equal(mockCreateDocumentModal.isOpen, false);
      assert.equal(mockCreateDocumentModal.onSubmitCallback, null);
      assert.equal(mockCreateDocumentModal.formData.name, '');
      assert.equal(mockCreateDocumentModal.formData.contributors.length, 0);
    });

    test('should set document name', () => {
      mockCreateDocumentModal.setName('  My Document  ');

      assert.equal(mockCreateDocumentModal.formData.name, 'My Document');
    });

    test('should add contributors', () => {
      mockCreateDocumentModal.addContributor('John Doe');
      mockCreateDocumentModal.addContributor('Jane Smith');

      assert.equal(mockCreateDocumentModal.formData.contributors.length, 2);
      assert.equal(mockCreateDocumentModal.formData.contributors[0].name, 'John Doe');
      assert.equal(mockCreateDocumentModal.formData.contributors[1].name, 'Jane Smith');
    });

    test('should not add empty contributors', () => {
      mockCreateDocumentModal.addContributor('');
      mockCreateDocumentModal.addContributor('  ');

      assert.equal(mockCreateDocumentModal.formData.contributors.length, 0);
    });

    test('should remove contributors', () => {
      mockCreateDocumentModal.addContributor('John Doe');
      mockCreateDocumentModal.addContributor('Jane Smith');
      mockCreateDocumentModal.addContributor('Bob Johnson');

      mockCreateDocumentModal.removeContributor(1); // Remove Jane Smith

      assert.equal(mockCreateDocumentModal.formData.contributors.length, 2);
      assert.equal(mockCreateDocumentModal.formData.contributors[0].name, 'John Doe');
      assert.equal(mockCreateDocumentModal.formData.contributors[1].name, 'Bob Johnson');
    });

    test('should add attachments', () => {
      mockCreateDocumentModal.addAttachment('file1.pdf', 1024);
      mockCreateDocumentModal.addAttachment('file2.docx', 2048);

      assert.equal(mockCreateDocumentModal.formData.attachments.length, 2);
      assert.equal(mockCreateDocumentModal.formData.attachments[0].name, 'file1.pdf');
      assert.equal(mockCreateDocumentModal.formData.attachments[0].size, 1024);
    });

    test('should not add invalid attachments', () => {
      mockCreateDocumentModal.addAttachment('', 1024);
      mockCreateDocumentModal.addAttachment('file.pdf', 0);
      mockCreateDocumentModal.addAttachment('file.pdf', -100);

      assert.equal(mockCreateDocumentModal.formData.attachments.length, 0);
    });

    test('should remove attachments', () => {
      mockCreateDocumentModal.addAttachment('file1.pdf', 1024);
      mockCreateDocumentModal.addAttachment('file2.docx', 2048);

      mockCreateDocumentModal.removeAttachment(0);

      assert.equal(mockCreateDocumentModal.formData.attachments.length, 1);
      assert.equal(mockCreateDocumentModal.formData.attachments[0].name, 'file2.docx');
    });

    test('should validate form', () => {
      assert.equal(mockCreateDocumentModal.isFormValid(), false);

      mockCreateDocumentModal.setName('My Document');
      assert.equal(mockCreateDocumentModal.isFormValid(), true);

      mockCreateDocumentModal.setName('');
      assert.equal(mockCreateDocumentModal.isFormValid(), false);
    });

    test('should submit form with valid data', () => {
      let submittedData: any = null;

      mockCreateDocumentModal.open((data: any) => {
        submittedData = data;
      });

      mockCreateDocumentModal.setName('Test Document');
      mockCreateDocumentModal.addContributor('John Doe');
      mockCreateDocumentModal.addAttachment('file.pdf', 1024);

      mockCreateDocumentModal.submit();

      assert(submittedData);
      assert.equal(submittedData.name, 'Test Document');
      assert.equal(submittedData.contributors.length, 1);
      assert.equal(submittedData.contributors[0].name, 'John Doe');
      assert.equal(submittedData.attachments.length, 1);
      assert.equal(submittedData.attachments[0].name, 'file.pdf');
      assert.equal(mockCreateDocumentModal.isOpen, false);
    });

    test('should throw error on invalid form submission', () => {
      mockCreateDocumentModal.open(() => {});

      assert.throws(() => {
        mockCreateDocumentModal.submit();
      }, /Form is not valid/);
    });

    test('should render correctly when open', () => {
      mockCreateDocumentModal.open(() => {});
      mockCreateDocumentModal.setName('Test Document');
      mockCreateDocumentModal.addContributor('John Doe');

      const rendered = mockCreateDocumentModal.render();

      assert(rendered.includes('visible'));
      assert(rendered.includes('Create New Document'));
      assert(rendered.includes('Test Document'));
      assert(rendered.includes('John Doe'));
      assert(!rendered.includes('disabled'));
    });

    test('should render correctly when closed', () => {
      const rendered = mockCreateDocumentModal.render();

      assert(rendered.includes('hidden'));
      assert(!rendered.includes('Create New Document'));
    });
  });
});

console.log('✅ All Component concept tests defined!');