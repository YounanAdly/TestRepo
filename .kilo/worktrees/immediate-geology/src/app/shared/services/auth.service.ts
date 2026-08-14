import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { Constants } from '../../constants';
import { BaseCrudService } from './base-crud.service';
import { CommonService } from './common.service';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user?: unknown;
  expiresIn?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenStorageKey = 'auth_token';
  private readonly contactStorageKey = 'auth_contact';

  readonly isAuthenticated = signal<boolean>(this.hasToken());
  readonly contactInfo = signal<unknown | null>(this.readStoredContact());

  private baseCrudService = inject(BaseCrudService)
  private commonService = inject(CommonService)


  /**
   * Authenticates the user and stores the returned token on success.
   * @param credentials Username and password
   * @returns Observable that emits the authentication response
   */
  login(credentials: AuthCredentials): Observable<AuthResponse> {
    const url = '/auth/login';
    return this.baseCrudService.create(url, credentials).pipe(
      tap((response) => {
        if (response?.token) {
          this.setToken(response.token);
        }
      })
    );
  }

  /**
   * Logs out the current user by clearing token and cached contact info.
   */
  logout(): void {
    this.clearToken();
    this.clearContact();
    this.isAuthenticated.set(false);
  }

  /**
   * Retrieves the stored JWT token, if any.
   * @returns Token string or null when not present
   */
  getToken(): string | null {
    return this.commonService.getLocalStorage(this.tokenStorageKey);
  }

  /**
   * Stores a JWT token and marks the session as authenticated.
   * @param token JWT access token
   */
  setToken(token: string): void {
    this.commonService.setLocalStorage(this.tokenStorageKey, token);
    this.isAuthenticated.set(true);
  }

  /**
   * Removes the JWT token from storage.
   */
  clearToken(): void {
    localStorage.removeItem(this.tokenStorageKey);
  }

  /**
   * Returns cached contact info synchronously if available, otherwise null.
   */
  getContactInfo<T = unknown>(): T | null {
    return (this.contactInfo() as T | null);
  }

  /**
   * Loads contact info once from the API and caches it. Subsequent calls
   * return the cached value without hitting the API again.
   * @returns Observable that emits the contact info (cached on subsequent calls)
   */
  fetchContactInfo<T = unknown>(): Observable<T[]> {
    const cached = this.contactInfo();
    if (cached != null) {
      return of(cached as T[]);
    }
    return this.baseCrudService.get(Constants.getContactInfoUrl).pipe(
      tap((info) => this.setContact(info))
    );
  }

  /**
   * Persists contact info to storage and updates the signal.
   * @param info Contact information object
   */
  private setContact(info: unknown): void {
    this.commonService.setLocalStorage(this.contactStorageKey, JSON.stringify(info));
    this.contactInfo.set(info);
  }

  /**
   * Clears persisted and in-memory contact info.
   */
  private clearContact(): void {
    localStorage.removeItem(this.contactStorageKey);
    this.contactInfo.set(null);
  }

  /**
   * Reads contact info from storage or returns null when absent.
   */
  private readStoredContact(): unknown | null {
    const raw = this.commonService.getLocalStorage(this.contactStorageKey);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  }

  /**
   * Indicates whether a JWT token currently exists in storage.
   */
  hasToken(): boolean {
    return !!this.getToken();
  }
}


