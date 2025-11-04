export type StateChangeListener<T> = (state: T) => void;

export class Store<T> {
  private state: T;
  private listeners: Set<StateChangeListener<T>> = new Set();

  constructor(initialState: T) {
    this.state = { ...initialState };
  }

  subscribe(listener: StateChangeListener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): T {
    return { ...this.state };
  }

  setState(partial: Partial<T>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...partial };

    if (this.hasStateChanged(previousState, this.state)) {
      this.notifyListeners();
    }
  }

  private hasStateChanged(prevState: T, newState: T): boolean {
    return JSON.stringify(prevState) !== JSON.stringify(newState);
  }

  private notifyListeners(): void {
    const currentState = { ...this.state };
    this.listeners.forEach(listener => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  destroy(): void {
    this.listeners.clear();
  }
}