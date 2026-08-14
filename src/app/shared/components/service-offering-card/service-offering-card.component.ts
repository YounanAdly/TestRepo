import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-service-offering-card',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './service-offering-card.component.html',
  styleUrl: './service-offering-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceOfferingCardComponent {
  /** Translate key fallback for the card title. */
  readonly titleKey = input('');
  /** Translate key fallback for the card description. */
  readonly descriptionKey = input('');
  readonly imageSrc = input('');
  readonly imageAltKey = input('');
  readonly actionLabelKey = input('home.services.applyNow');

  /** Direct localised title — takes precedence over `titleKey` when set. */
  readonly title = input('');
  /** Direct localised description — takes precedence over `descriptionKey` when set. */
  readonly description = input('');
  /** Direct localised alt text — takes precedence over `imageAltKey` when set. */
  readonly imageAlt = input('');

  readonly apply = output<void>();

  onApply(): void {
    this.apply.emit();
  }
}
