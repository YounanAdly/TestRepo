import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  inject,
  input,
} from '@angular/core';
import { MotionService } from '../services/motion.service';

/**
 * Reveal-on-scroll directive backed by IntersectionObserver.
 *
 * Usage:
 *   <section appScrollReveal>...</section>
 *   <section appScrollReveal variant="fade-up" delay="120">...</section>
 *
 * Variants must match the reveal classes defined in `src/styles/global.theme.scss`:
 *   - 'fade-up'   (default) -> opacity + translateY
 *   - 'fade'                -> opacity only
 *   - 'fade-in-x'           -> opacity + translateX (RTL-safe via logical transform)
 *
 * Respects `prefers-reduced-motion`: applies the visible end state immediately
 * with no transition.
 */
@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective {
  readonly variant = input<'fade-up' | 'fade' | 'fade-in-x'>('fade-up');
  readonly delay = input<number>(0);
  readonly threshold = input<number>(0.15);
  readonly once = input<boolean>(true);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly motion = inject(MotionService);

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const el = this.host.nativeElement;
    const baseClass = `reveal-${this.variant()}`;

    if (!isPlatformBrowser(this.platformId)) {
      this.renderer.addClass(el, baseClass);
      this.renderer.addClass(el, 'is-visible');
      return;
    }

    if (this.motion.prefersReducedMotion()) {
      this.renderer.addClass(el, baseClass);
      this.renderer.addClass(el, 'is-visible');
      return;
    }

    this.renderer.addClass(el, baseClass);

    const delayValue = this.delay();
    if (delayValue > 0) {
      this.renderer.setStyle(el, 'transition-delay', `${delayValue}ms`);
    }

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          this.renderer.addClass(el, 'is-visible');
          if (this.once()) {
            this.observer?.unobserve(el);
          }
        }
      },
      { threshold: this.threshold(), rootMargin: '0px 0px -40px 0px' },
    );
    this.observer.observe(el);

    this.destroyRef.onDestroy(() => this.observer?.disconnect());
  }
}
