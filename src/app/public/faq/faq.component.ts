
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { SeoService } from '../../shared/services/seo.service';
import { LanguageService } from '../../shared/services/language.service';
import { HomePageApi } from '../../shared/services/home-page/home-page-api.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [RouterLink, TranslateModule, SkeletonLoaderComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent {
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly homePageApi = inject(HomePageApi);

  protected readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(map(e => e.lang)),
    { initialValue: this.translate.currentLang || 'en' },
  );

  protected readonly isAr = computed(() => this.currentLang() === 'ar');

  protected readonly faqsResource = this.homePageApi.faqsPage();

  protected readonly faqs = computed(() =>
    this.faqsResource.value()?.result?.faqs ?? [],
  );

  protected readonly pageTitle = computed(() => {
    const r = this.faqsResource.value()?.result;
    return this.isAr() ? (r?.faqPageTitleArabic ?? '') : (r?.faqPageTitleEng ?? '');
  });

  protected readonly pageDescription = computed(() => {
    const r = this.faqsResource.value()?.result;
    return this.isAr() ? (r?.faqPageDescriptionArabic ?? '') : (r?.faqPageDescriptionEng ?? '');
  });

  protected readonly activeFaqIndex = signal<number>(0);

  constructor() {
    effect(() => {
      // Re-run SEO whenever language changes
      void this.currentLang();
      this.setSeo();
    });
  }

  protected onToggle(index: number): void {
    this.activeFaqIndex.update(current => (current === index ? -1 : index));
  }

  protected onGoToInquiry(): void {
    void this.router.navigate(['/', this.currentLang(), 'inquiry']);
  }

  private setSeo(): void {
    this.seo.update({
      title: this.translate.instant('faqPage.seo.title'),
      description: this.translate.instant('faqPage.seo.description'),
      keywords: this.translate.instant('faqPage.seo.keywords'),
      url: this.translate.instant('faqPage.seo.url'),
      author: this.translate.instant('faqPage.seo.author'),
      type: 'website',
    });
  }
}
