
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';
import { ServiceAboutSectionComponent } from '../../shared/components/service-about-section/service-about-section.component';
import { HomePageApi } from '../../shared/services/home-page/home-page-api.service';

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [RouterLink, TranslateModule, ServiceAboutSectionComponent],
  templateUrl: './service-details.component.html',
  styleUrl: './service-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceDetailsComponent {
  /** Bound from `?service=` query param via `withComponentInputBinding()`. */
  readonly service = input<string>('');

  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly homePageApi = inject(HomePageApi);

  protected readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map(e => e.lang),
      startWith(this.languageService.getCurrentLanguage() || 'en'),
    ),
    { initialValue: this.languageService.getCurrentLanguage() || 'en' },
  );

  protected readonly isAr = computed(() => this.currentLang() === 'ar');

  protected readonly cardResource = this.homePageApi.serviceCard(() => this.service() || null);

  protected readonly cardData = computed(() => this.cardResource.value()?.result ?? null);

  protected readonly pageTitle = computed(() => {
    const card = this.cardData();
    if (!card) return '';
    return this.isAr() ? card.name : card.serviceCardTitleEnglish;
  });

  protected readonly introDescription = computed(() => {
    const card = this.cardData();
    if (!card) return '';
    return this.isAr() ? card.processDescriptionArabic : card.processDescriptionEng;
  });

  protected readonly processSteps = computed(() => {
    const card = this.cardData();
    if (!card) return [];
    return [...card.serviceProcesses].sort((a, b) => Number(a.order) - Number(b.order));
  });

  protected readonly feesValue = computed(() => {
    const category = this.cardData()?.category;
    if (!category?.length) return null;
    return this.isAr() ? category[0].feesArabic : category[0].fees;
  });

  protected readonly estimatedTimeValue = computed(() => {
    const category = this.cardData()?.category;
    if (!category?.length) return '';
    const val = this.isAr() ? category[0].estimatedTimeArabic : category[0].estimatedTimeEng;
    return val ?? '';
  });

  protected readonly eligibilityValue = computed(() => {
    const category = this.cardData()?.category;
    if (!category?.length) return null;
    return this.isAr() ? category[0].eligibility : category[0].eligibilityEng;
  });

  protected readonly documentNames = computed(() => {
    const docs = this.cardData()?.requiredDocument;
    if (!docs?.length) return null;
    return docs.map(d => this.isAr() ? d.requiredDocumentNameArabic : d.requiredDocumentNameEnglish);
  });

  constructor() {
    effect(() => {
      const title = this.pageTitle();
      this.seo.update({
        title: `${title || this.translate.instant('serviceDetailsPage.seo.titleSuffix')}`,
        description: this.translate.instant('serviceDetailsPage.seo.description'),
        keywords: this.translate.instant('serviceDetailsPage.seo.keywords'),
        url: this.translate.instant('serviceDetailsPage.seo.url'),
        author: this.translate.instant('serviceDetailsPage.seo.author'),
        type: 'website',
      });
    });
  }
}
