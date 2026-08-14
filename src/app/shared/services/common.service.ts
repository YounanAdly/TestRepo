import { isPlatformBrowser } from "@angular/common";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class CommonService {
    private platformId = inject(PLATFORM_ID);

    /**
     * Stores a key/value pair in localStorage when running in the browser.
     * @param key Storage key
     * @param value Storage value (string)
     */
    setLocalStorage(key: string, value: any): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(key, value);
        }
    }

    /**
     * Retrieves a value from localStorage by key when in the browser.
     * @param key Storage key
     * @returns Stored value or null
     */
    getLocalStorage(key: string): any {
        if (isPlatformBrowser(this.platformId)) {
            return localStorage.getItem(key);
        }
    }

    SetCookie(key: string): void {

    }

    /**
     * Reads a cookie value by key when in the browser.
     * @param key Cookie name
     * @returns Cookie value or null
     */
    getCookie(key: string): any {
        if (isPlatformBrowser(this.platformId)) {
            const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
            if (match) {
                return match[2];
            }
            return null;
        }
    }

}