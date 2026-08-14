import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';
import autoAnimate, { type AutoAnimateOptions } from '@formkit/auto-animate';
import { MotionService } from '../services/motion.service';

/**
 * Smooth add/remove/reorder animations for any container of children
 * (lists, grids, accordions, filtered results) via @formkit/auto-animate.
 *
 * Usage:
 *   <ul appAutoAnimate>@for (item of items(); track item.id) { <li>...</li> }</ul>
 *   <div appAutoAnimate [animateDuration]="200">...</div>
 *
 * Respects `prefers-reduced-motion`: animation is disabled, items snap into place.
 */
@Directive({
  selector: '[appAutoAnimate]',
  standalone: true,
})
export class AutoAnimateDirective {
  readonly animateDuration = input<number>(220);
  readonly animateEasing = input<AutoAnimateOptions['easing']>('ease-in-out');

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly motion = inject(MotionService);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const controller = autoAnimate(this.host.nativeElement, {
      duration: this.animateDuration(),
      easing: this.animateEasing(),
    });

    if (this.motion.prefersReducedMotion()) {
      controller.disable();
    }

    this.destroyRef.onDestroy(() => controller.destroy?.());
  }
}
