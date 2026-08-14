
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Reusable skeleton loader — replaces spinners with content-shaped placeholders.
 *
 * Variants:
 *   - `text`       — stacked lines of varying width (paragraphs, descriptions)
 *   - `card`       — image block + text lines (service/media cards)
 *   - `avatar`     — circular avatar + two text lines (list items, notifications)
 *   - `table-row`  — horizontal cells (data tables, due-payment rows)
 *
 * Usage:
 *   <app-skeleton-loader variant="card" [count]="3" />
 */
export type SkeletonVariant = 'text' | 'card' | 'avatar' | 'table-row';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [],
  templateUrl: './skeleton-loader.component.html',
  styleUrl:    './skeleton-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonLoaderComponent {
  readonly variant = input<SkeletonVariant>('card');
  /** Number of skeleton items to render. */
  readonly count = input<number>(1);

  readonly items = computed<number[]>(() => Array.from({ length: this.count() }, (_, i) => i));
}
