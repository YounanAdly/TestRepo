
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Reusable post-authentication loading splash.
 *
 * Covers the full viewport with a branded teal gradient while the app
 * navigates to the next route. Show it for a fixed duration (e.g. 2 s)
 * then perform the navigation in the parent component.
 *
 * Usage:
 *   <app-post-auth-splash
 *     *ngIf="isNavigating"
 *     [greetingKey]="'login.loading.greeting'"
 *     [messageKey]="'login.loading.message'"
 *     [logoSrc]="logoCard" />
 */
@Component({
  selector: 'app-post-auth-splash',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './post-auth-splash.component.html',
  styleUrl:    './post-auth-splash.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostAuthSplashComponent {
  /** ngx-translate key for the large greeting line. */
  readonly greetingKey = input('login.loading.greeting');
  /** ngx-translate key for the sub-message line. */
  readonly messageKey = input('login.loading.message');
  /** Absolute or relative path to the logo image. */
  readonly logoSrc = input('assets/images/logoCard.svg');
}
