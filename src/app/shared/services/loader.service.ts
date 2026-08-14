import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private activeRequests = signal(0);

  readonly isLoading = computed(() => this.activeRequests() > 0);

  /**
   * Increments the active request counter and toggles the loading state on.
   */
  show(): void {
    this.activeRequests.update(count => count + 1);
  }

  /**
   * Decrements the active request counter and toggles the loading state off when zero.
   */
  hide(): void {
    this.activeRequests.update(count => Math.max(0, count - 1));
  }
}
