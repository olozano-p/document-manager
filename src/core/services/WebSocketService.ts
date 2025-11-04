import { Document, WebSocketMessage } from '../../types/index.js';

export type WebSocketEventHandler = (message: WebSocketMessage) => void;
export type ConnectionStatusHandler = (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private url = 'ws://localhost:3001';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private documentHandlers: Set<WebSocketEventHandler> = new Set();
  private statusHandlers: Set<ConnectionStatusHandler> = new Set();
  private isDestroyed = false;

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(): void {
    if (this.isDestroyed) {
      return;
    }

    this.notifyStatusChange('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyStatusChange('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.notifyDocumentHandlers(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.notifyStatusChange('disconnected');

        if (!this.isDestroyed && event.code !== 1000) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyStatusChange('error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.notifyStatusChange('error');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.isDestroyed = true;

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.documentHandlers.clear();
    this.statusHandlers.clear();
  }

  onMessageReceived(handler: WebSocketEventHandler): () => void {
    this.documentHandlers.add(handler);
    return () => this.documentHandlers.delete(handler);
  }

  onStatusChange(handler: ConnectionStatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.connect();
      }
    }, delay);
  }

  private notifyDocumentHandlers(message: WebSocketMessage): void {
    this.documentHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in document handler:', error);
      }
    });
  }

  private notifyStatusChange(status: 'connected' | 'disconnected' | 'connecting' | 'error'): void {
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    });
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }
}