
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';
import { AboutUsApi } from '../../shared/services/about-us/about-us-api.service';
import { AboutUsResult } from '../../shared/services/about-us/about-us.types';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

type AboutTab = 'overview' | 'mission' | 'vision' | 'values';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [RouterModule, TranslateModule, NgOptimizedImage, SkeletonLoaderComponent],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutUsComponent {
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly aboutUsApi = inject(AboutUsApi);
  private readonly translate = inject(TranslateService);

  protected readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map(e => e.lang),
      startWith(this.languageService.getCurrentLanguage() || 'en'),
    ),
    { initialValue: this.languageService.getCurrentLanguage() || 'en' },
  );

  protected readonly activeTab = signal<AboutTab>('overview');

  protected readonly aboutResource = this.aboutUsApi.detail();

  readonly tabs: { key: AboutTab; fallbackLabelKey: string; iconPath: string }[] = [
    { key: 'overview', fallbackLabelKey: 'aboutUsPage.tabs.overview', iconPath: 'assets/images/au-tab-overview.svg' },
    { key: 'mission',  fallbackLabelKey: 'aboutUsPage.tabs.mission',  iconPath: 'assets/images/au-tab-mission.svg'  },
    { key: 'vision',   fallbackLabelKey: 'aboutUsPage.tabs.vision',   iconPath: 'assets/images/au-tab-vision.svg'   },
    { key: 'values',   fallbackLabelKey: 'aboutUsPage.tabs.values',   iconPath: 'assets/images/au-tab-values.svg'   },
  ];

  readonly statCards = [
    {
      iconPath: 'assets/images/au-icon-4.svg',
      valueKey: 'aboutUsPage.stats.card1.value',
      labelKey: 'aboutUsPage.stats.card1.label',
      descKey:  'aboutUsPage.stats.card1.desc',
    },
    {
      iconPath: 'assets/images/au-icon-1.svg',
      valueKey: 'aboutUsPage.stats.card2.value',
      labelKey: 'aboutUsPage.stats.card2.label',
      descKey:  'aboutUsPage.stats.card2.desc',
    },
    {
      iconPath: 'assets/images/au-icon-2.svg',
      valueKey: 'aboutUsPage.stats.card3.value',
      labelKey: 'aboutUsPage.stats.card3.label',
      descKey:  'aboutUsPage.stats.card3.desc',
    },
    {
      iconPath: 'assets/images/au-icon-3.svg',
      valueKey: 'aboutUsPage.stats.card4.value',
      labelKey: 'aboutUsPage.stats.card4.label',
      descKey:  'aboutUsPage.stats.card4.desc',
    },
  ];

  protected readonly aboutData = computed<AboutUsResult | null>(
    () => this.aboutResource.value()?.result ?? null,
  );

  protected readonly heroTitle = computed<string | null>(
    () => this.localized(this.aboutData()?.aboutUs),
  );

  protected readonly heroDescription = computed<string | null>(
    () => this.localized(this.aboutData()?.aboutUs, 'description'),
  );

  protected readonly overviewTitle = computed<string | null>(
    () => this.localized(this.aboutData()?.overview),
  );

  protected readonly overviewDescription = computed<string | null>(
    () => this.localized(this.aboutData()?.overview, 'description'),
  );

  protected readonly missionTitle = computed<string | null>(
    () => this.localized(this.aboutData()?.mission),
  );

  protected readonly missionDescription = computed<string | null>(
    () => this.localized(this.aboutData()?.mission, 'description'),
  );

  protected readonly visionTitle = computed<string | null>(
    () => this.localized(this.aboutData()?.vision),
  );

  protected readonly visionDescription = computed<string | null>(
    () => this.localized(this.aboutData()?.vision, 'description'),
  );

  protected readonly valuesTitle = computed<string | null>(() => {
    const firstValue = this.aboutData()?.values?.[0];
    return this.localized(firstValue) ?? this.localized(this.aboutData()?.values?.[0], 'description');
  });

  protected readonly valuesDescription = computed<string | null>(() => {
    const valueRows = this.aboutData()?.values ?? [];
    if (!valueRows.length) return null;
    const lines = valueRows
      .map(row => this.localized(row, 'description')?.trim() ?? '')
      .filter(Boolean);
    return lines.join('\n');
  });

  protected readonly valuesLines = computed<string[]>(() => {
    const text = this.valuesDescription() ?? '';
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  });

  private readonly seoEffect = effect(() => {
    // Re-read `currentLang` so the SEO title tracks language switches.
    this.currentLang();
    this.seo.update({ title: this.translate.instant('aboutUsPage.seo.title') });
  });

  setTab(tab: AboutTab): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    void this.router.navigate(['/', this.currentLang(), 'home']);
  }

  protected tabLabel(tab: AboutTab): string | null {
    const data = this.aboutData();
    if (!data) return null;

    if (tab === 'overview') return this.localized(data.overview);
    if (tab === 'mission') return this.localized(data.mission);
    if (tab === 'vision') return this.localized(data.vision);
    return this.valuesTitle();
  }

  protected localized(
    section: { titleAr: string; titleEn: string; descriptionAr: string; descriptionEn: string } | undefined,
    field: 'title' | 'description' = 'title',
  ): string | null {
    if (!section) return null;
    const isAr = this.currentLang() === 'ar';
    const value = field === 'title'
      ? (isAr ? section.titleAr : section.titleEn)
      : (isAr ? section.descriptionAr : section.descriptionEn);
    return value?.trim() || null;
  }
}
