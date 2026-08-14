
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { HomePageApi } from '../../services/home-page/home-page-api.service';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [TranslateModule, SkeletonLoaderComponent],
  templateUrl: './faq-section.component.html',
  styleUrl: './faq-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqSectionComponent {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly homePageApi = inject(HomePageApi);

  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(map(e => e.lang)),
    { initialValue: this.translate.currentLang || 'en' },
  );

  protected readonly faqsResource = this.homePageApi.faqs();

  protected readonly faqs = computed(() =>
    this.faqsResource.value()?.result?.faqs ?? [],
  );

  protected readonly isAr = computed(() => this.currentLang() === 'ar');

  /** API-driven section title, language-matched. Empty string while loading (template supplies fallback). */
  protected readonly faqTitle = computed(() => {
    const result = this.faqsResource.value()?.result;
    return this.isAr() ? (result?.faqTitleArabic ?? '') : (result?.faqTitleEnglish ?? '');
  });

  protected readonly activeFaqIndex = signal<number>(0);

  onViewMore(): void {
    void this.router.navigate(['/', this.currentLang(), 'faq']);
  }

  onToggle(index: number): void {
    this.activeFaqIndex.update(current => (current === index ? -1 : index));
  }
}
