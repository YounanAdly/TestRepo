import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BaseCrudService<T> {
  constructor(
    protected http: HttpClient
  ) { }

  /**
   * Sends a GET request to list resources.
   * @param apiUrl Relative API path (will be prefixed by environment base URL)
   * @returns Observable emitting an array of resources of type T
   */
  get(apiUrl: string): Observable<T[]> {
    return this.http.get<T[]>(environment.AppConfig.apiBaseUrl + apiUrl).pipe(catchError(this.handleError));
  }

  /**
   * Sends a GET request to retrieve a single resource by its id.
   * @param apiUrl Relative API path (will be prefixed by environment base URL)
   * @param id Identifier of the resource
   * @returns Observable emitting the resource of type T
   */
  getById(apiUrl: string, id: string | number): Observable<T> {
    return this.http.get<T>(environment.AppConfig.apiBaseUrl + apiUrl + `/${id}`).pipe(catchError(this.handleError));
  }

  /**
   * Sends a POST request to create a new resource.
   * @param apiUrl Relative API path (will be prefixed by environment base URL)
   * @param item Resource payload
   * @returns Observable emitting the created resource of type T
   */
  create(apiUrl: string, item: T): Observable<T> {
    return this.http.post<T>(environment.AppConfig.apiBaseUrl + apiUrl, item).pipe(catchError(this.handleError));
  }

  /**
   * Sends a PUT request to update an existing resource.
   * @param apiUrl Relative API path (will be prefixed by environment base URL)
   * @param id Identifier of the resource to update
   * @param item Updated resource payload
   * @returns Observable emitting the updated resource of type T
   */
  update(apiUrl: string, id: string | number, item: T): Observable<T> {
    return this.http.put<T>(environment.AppConfig.apiBaseUrl + apiUrl + `/${id}`, item).pipe(catchError(this.handleError));
  }

  /**
   * Sends a DELETE request to remove a resource by id.
   * @param apiUrl Relative API path (will be prefixed by environment base URL)
   * @param id Identifier of the resource to delete
   * @returns Observable emitting void upon successful deletion
   */
  delete(apiUrl: string, id: string | number): Observable<void> {
    return this.http.delete<void>(environment.AppConfig.apiBaseUrl + apiUrl + `/${id}`).pipe(catchError(this.handleError));
  }

  /**
  * Converts HttpErrorResponse into a user-facing message and rethrows it.
  * @param error HttpErrorResponse returned by HttpClient
  * @returns Observable error with a formatted message
  */
  protected handleError(error: HttpErrorResponse) {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Client-side / network error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Backend returned unsuccessful response code
      errorMessage = `Server Error [${error.status}]: ${error.message}`;
    }
    return throwError(() => errorMessage);
  }
}
