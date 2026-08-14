import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | string;
}

/**
 * Adaptive HTTP timeout source.
 *
 * Reads the browser's Network Information API (when available) and returns
 * timeout ceilings that scale with the user's effective connection class so
 * 2G/3G clients don't fail fast while desktop clients still hit a hard cap.
 *
 * SSR-safe: returns the desktop default when not running in the browser.
 * Safari does not implement `navigator.connection`; it falls through to the
 * `default` branch and uses the 4G/wifi value, which is the correct fallback.
 */
@Injectable({ providedIn: 'root' })
export class NetworkService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Read SLA in ms based on the Network Information API. */
  readTimeoutMs(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 15_000;
    }
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    switch (conn?.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 45_000;
      case '3g':
        return 25_000;
      default:
        return 15_000;
    }
  }

  /** Write SLA in ms — slightly more headroom than reads to absorb upload time. */
  writeTimeoutMs(): number {
    return this.readTimeoutMs() + 5_000;
  }
}
