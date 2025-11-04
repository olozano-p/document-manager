import './ui/components/DocumentCard.js';
import './ui/components/DocumentList.js';
import './ui/components/NotificationBanner.js';
import './ui/components/CreateDocumentModal.js';
import './ui/components/DocumentManager.js';

class Application {
  private static instance: Application;

  static getInstance(): Application {
    if (!Application.instance) {
      Application.instance = new Application();
    }
    return Application.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.setupGlobalErrorHandlers();
      this.logBuildInfo();

      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showFallbackError();
    }
  }

  private setupGlobalErrorHandlers(): void {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleGlobalError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleGlobalError(event.reason);
    });
  }

  private handleGlobalError(error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    const existingErrorBanner = document.querySelector('.global-error-banner');
    if (existingErrorBanner) {
      return;
    }

    const errorBanner = document.createElement('div');
    errorBanner.className = 'global-error-banner';
    errorBanner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #dc2626;
        color: white;
        padding: 12px 20px;
        text-align: center;
        font-size: 14px;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <span>� ${errorMessage}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          margin-left: 10px;
        ">�</button>
      </div>
    `;

    document.body.appendChild(errorBanner);

    setTimeout(() => {
      errorBanner.remove();
    }, 8000);
  }

  private showFallbackError(): void {
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #f9fafb;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 500px;
        ">
          <h1 style="color: #dc2626; margin-bottom: 16px;">Application Error</h1>
          <p style="color: #6b7280; margin-bottom: 24px;">
            The application failed to initialize. Please refresh the page or check the console for details.
          </p>
          <button onclick="window.location.reload()" style="
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
          ">
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }

  private logBuildInfo(): void {
    console.log('Document Manager Application');
    console.log('Built with vanilla TypeScript & Web Components');
    console.log('Architecture: Service Layer + Observer Pattern + Native DOM APIs');

    console.log('Development mode');
    console.log('Server should be running on http://localhost:3001');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = Application.getInstance();
  await app.initialize();
});

export { Application };