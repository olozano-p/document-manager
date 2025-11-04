import { Document } from '../../types/index.js';

export class ApiService {
  private static instance: ApiService;
  private baseUrl = 'http://localhost:3001';

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async fetchDocuments(): Promise<Document[]> {
    try {
      const response = await fetch(`${this.baseUrl}/documents`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw new Error('Failed to fetch documents. Please check if the server is running.');
    }
  }

  async retryFetch(
    url: string,
    options?: RequestInit,
    maxRetries = 3,
    delay = 1000
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        if (response.ok) {
          return response;
        }

        if (response.status >= 500 && attempt < maxRetries) {
          await this.delay(delay * attempt);
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          await this.delay(delay * attempt);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isServerAvailable(): Promise<boolean> {
    return fetch(`${this.baseUrl}/documents`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    .then(response => response.ok)
    .catch(() => false);
  }
}