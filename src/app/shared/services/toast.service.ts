import { LiveAnnouncer } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { LanguageService } from './language.service';

/**
 * Translation-aware toast facade over PrimeNG `MessageService`.
 *
 * Components must NOT inject `MessageService` directly — go through this
 * service so messages are translated and announced to assistive tech via
 * `LiveAnnouncer` automatically.
 *
 * Each method accepts an optional `source` (HttpErrorResponse or an API
 * envelope) — when present and the body carries `errorMessageEn` /
 * `errorMessageAr`, the localized server message is used as the toast detail
 * (overriding the fallback `detailKey`). The summary always comes from
 * `summaryKey` so titles stay consistent across the app.
 *
 * Usage:
 *   private readonly toast = inject(ToastService);
 *   this.toast.success('inquiry.submitSuccess');
 *   this.toast.error('errors.serverTitle', 'errors.serverDetail');
 *   // Prefer the server's localized message, fall back to keys:
 *   this.toast.error('login.errors.notRegisteredTitle',
 *                    'login.errors.notRegisteredDetail', err);
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly msg = inject(MessageService);
  private readonly t = inject(TranslateService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly langService = inject(LanguageService);

  success(summaryKey: string, detailKey?: string, source?: unknown): void {
    const summary = this.t.instant(summaryKey);
    const detail = this.resolveDetail(detailKey, source);
    this.msg.add({ severity: 'success', summary, detail, life: 3500 });
    this.announcer.announce(detail ?? summary, 'polite');
  }

  error(summaryKey: string, detailKey?: string, source?: unknown): void {
    const summary = this.t.instant(summaryKey);
    const detail = this.resolveDetail(detailKey, source);
    this.msg.add({ severity: 'error', summary, detail, life: 5000 });
    this.announcer.announce(detail ?? summary, 'assertive');
  }

  warn(summaryKey: string, detailKey?: string, source?: unknown): void {
    const summary = this.t.instant(summaryKey);
    const detail = this.resolveDetail(detailKey, source);
    this.msg.add({ severity: 'warn', summary, detail, life: 4500 });
    this.announcer.announce(detail ?? summary, 'polite');
  }

  info(summaryKey: string, detailKey?: string, source?: unknown): void {
    const summary = this.t.instant(summaryKey);
    const detail = this.resolveDetail(detailKey, source);
    this.msg.add({ severity: 'info', summary, detail, life: 4000 });
    this.announcer.announce(detail ?? summary, 'polite');
  }

  /**
   * Prefer the server's localized message (when provided) over the fallback
   * translation key. Falls back to the key when no server message is present.
   */
  private resolveDetail(detailKey: string | undefined, source: unknown): string | undefined {
    const serverMsg = this.extractServerMessage(source);
    if (serverMsg) {
      return serverMsg;
    }
    return detailKey ? this.t.instant(detailKey) : undefined;
  }

  /**
   * Extracts a language-appropriate message from either an `HttpErrorResponse`
   * (looks at `err.error`) or a raw API envelope (`{ errorMessageEn, errorMessageAr, ... }`).
   * Returns `null` when the source doesn't carry one.
   */
  private extractServerMessage(source: unknown): string | null {
    if (!source || typeof source !== 'object') {
      return null;
    }
    const body: unknown = source instanceof HttpErrorResponse
      ? source.error
      : source;
    if (!body || typeof body !== 'object') {
      return null;
    }
    const lang = (this.langService.getCurrentLanguage() || 'en').toLowerCase();
    const record = body as Record<string, unknown>;
    const primaryKey = lang === 'ar' ? 'errorMessageAr' : 'errorMessageEn';
    const fallbackKey = lang === 'ar' ? 'errorMessageEn' : 'errorMessageAr';
    const candidate = record[primaryKey] ?? record[fallbackKey];
    if (typeof candidate !== 'string') {
      return null;
    }
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
