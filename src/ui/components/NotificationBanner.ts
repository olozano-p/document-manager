import { createSVGIcon } from '../utils/dom.js';
import { NotificationData } from '../../types/index.js';

export class NotificationBanner extends HTMLElement {
  private notifications: NotificationData[] = [];
  private container: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  showNotification(notification: NotificationData) {
    const id = Math.random().toString(36).substr(2, 9);
    const notificationWithId = { ...notification, id };

    this.notifications.push(notificationWithId);
    this.addNotificationElement(notificationWithId);

    const duration = notification.duration || 5000;
    setTimeout(() => {
      this.removeNotification(id);
    }, duration);
  }

  private removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => (n as any).id !== id);
    this.removeNotificationElement(id);
  }

  private render() {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          pointer-events: none;
        }

        .notifications-container {
          display: flex;
          flex-direction: column-reverse;
          gap: 8px;
          max-width: 400px;
        }

        .notification {
          background: white;
          border-left: 4px solid;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          pointer-events: auto;
          animation: slideIn 0.3s ease;
          position: relative;
        }

        .notification.success {
          border-left-color: #10b981;
        }

        .notification.error {
          border-left-color: #ef4444;
        }

        .notification.info {
          border-left-color: #3b82f6;
        }

        .notification-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notification.success .notification-icon {
          color: #10b981;
        }

        .notification.error .notification-icon {
          color: #ef4444;
        }

        .notification.info .notification-icon {
          color: #3b82f6;
        }

        .notification-content {
          flex: 1;
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #374151;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .notification.removing {
          animation: slideOut 0.3s ease;
        }

        @media (max-width: 768px) {
          :host {
            bottom: 10px;
            right: 10px;
            left: 10px;
          }

          .notifications-container {
            max-width: none;
          }
        }
      </style>

      <div class="notifications-container"></div>
    `;

    this.container = this.shadowRoot!.querySelector('.notifications-container');
  }

  private addNotificationElement(notification: any) {
    if (!this.container) return;

    const notificationEl = document.createElement('div');
    notificationEl.className = `notification ${notification.type}`;
    notificationEl.dataset.id = notification.id;

    notificationEl.innerHTML = `
      <div class="notification-icon">
        ${this.getIconSVG(notification.type)}
      </div>
      <div class="notification-content">
        ${notification.message}
      </div>
      <button class="close-button" aria-label="Close notification">
        ${createSVGIcon('close', 16).outerHTML}
      </button>
    `;

    const closeButton = notificationEl.querySelector('.close-button');
    closeButton?.addEventListener('click', () => {
      this.removeNotification(notification.id);
    });

    this.container.appendChild(notificationEl);
  }

  private removeNotificationElement(id: string) {
    if (!this.container) return;

    const notificationEl = this.container.querySelector(`[data-id="${id}"]`);
    if (notificationEl) {
      notificationEl.classList.add('removing');
      setTimeout(() => {
        notificationEl.remove();
      }, 300); // Match the slideOut animation duration
    }
  }

  private getIconSVG(type: 'success' | 'error' | 'info'): string {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');

    switch (type) {
      case 'success':
        svg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>';
        break;
      case 'error':
        svg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>';
        break;
      case 'info':
        svg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>';
        break;
    }

    return svg.outerHTML;
  }
}

customElements.define('notification-banner', NotificationBanner);