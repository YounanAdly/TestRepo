// font-size.service.ts
import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { CommonService } from './common.service';
import { AppConfig } from '../../config/app.config';

@Injectable({ providedIn: 'root' })
export class FontSizeService {
    private platformId = inject(PLATFORM_ID);
    private commonService = inject(CommonService);

    private defaultSize = AppConfig.fontSize?.default ?? 10;
    private minSize = AppConfig.fontSize?.min ?? 8;
    private maxSize = AppConfig.fontSize?.max ?? 12;
    private step = AppConfig.fontSize?.step ?? 1;
    fontSize = signal<number>(this.load());

    constructor() {
        this.applyFontSize();
    }

    /**
     * Sets font size to the maximum allowed value and applies it.
     */
    increase() {
        if (AppConfig.fontSize?.enable === false) {
            this.reset();
            return;
        }
        if (this.fontSize() < this.maxSize) {
            const next = Math.min(this.maxSize, this.fontSize() + this.step);
            this.fontSize.set(next);
            this.applyFontSize();
        }
    }

    /**
     * Sets font size to the minimum allowed value and applies it.
     */
    decrease() {
        if (AppConfig.fontSize?.enable === false) {
            this.reset();
            return;
        }
        if (this.fontSize() > this.minSize) {
            const next = Math.max(this.minSize, this.fontSize() - this.step);
            this.fontSize.set(next);
            this.applyFontSize();
        }
    }

    /**
     * Resets to the default font size and applies it.
     */
    reset() {
        this.fontSize.set(this.defaultSize);
        this.applyFontSize();
    }

    /**
     * Applies the current font size to the document root and persists it.
     */
    applyFontSize() {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        const effective = (AppConfig.fontSize?.enable === false) ? this.defaultSize : this.fontSize();
        document.documentElement.style.fontSize = `${effective}px`;
        this.commonService.setLocalStorage('fontSize', effective.toString());
    }

    /**
     * Loads the persisted font size, clamped between min and max.
     * @returns The effective font size in pixels
     */
    load(): number {
        if (AppConfig.fontSize?.enable === false) {
            return this.defaultSize;
        }
        const stored = this.commonService.getLocalStorage('fontSize');
        const size = stored ? parseInt(stored, 10) : this.defaultSize;
        return Math.min(this.maxSize, Math.max(this.minSize, size));
    }

    /**
     * Indicates whether font size adjustment is enabled via configuration.
     */
    isFontSizeEnabled(): boolean {
        return AppConfig.fontSize?.enable;
    }
}
