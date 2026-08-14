import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

/**
 * Centralized accessibility-aware motion state.
 *
 * Consume `prefersReducedMotion` (signal) anywhere a component decides whether
 * to run a non-essential animation, instead of duplicating
 * `window.matchMedia('(prefers-reduced-motion: reduce)')` per file.
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _prefersReducedMotion = signal(false);

  readonly prefersReducedMotion = this._prefersReducedMotion.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._prefersReducedMotion.set(mq.matches);

    const handler = (event: MediaQueryListEvent) => this._prefersReducedMotion.set(event.matches);
    mq.addEventListener('change', handler);
    this.destroyRef.onDestroy(() => mq.removeEventListener('change', handler));
  }
}
