import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';
import { ServiceOfferingCardComponent } from '../../shared/components/service-offering-card/service-offering-card.component';
import { HomePageApi } from '../../shared/services/home-page/home-page-api.service';
import { HomePageServiceItem } from '../../shared/services/home-page/home-page.types';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, TranslateModule, ServiceOfferingCardComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesComponent {
  private readonly languageService = inject(LanguageService);
  private readonly homePageApi = inject(HomePageApi);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchQuery = signal('');
  private readonly currentLangSig = signal<string>(this.languageService.getCurrentLanguage() || 'en');

  protected readonly servicesResource = this.homePageApi.services();

  protected readonly filteredCards = computed(() => {
    const items: HomePageServiceItem[] = this.servicesResource.value()?.result?.services ?? [];
    const isAr = this.currentLangSig() === 'ar';
    const q = this.searchQuery().toLowerCase().trim();

    return items
      .map(s => ({
        serviceId: s.serviceId,
        title: isAr ? s.titleAr : s.titleEn,
        description: isAr ? s.descriptionAr : s.descriptionEn,
        imageSrc: s.icon ? `data:image/png;base64,${s.icon}` : 'assets/images/image-placeholder.png',
        imageAlt: isAr ? s.titleAr : s.titleEn,
      }))
      .filter(card =>
        !q || card.title.toLowerCase().includes(q) || card.description.toLowerCase().includes(q),
      );
  });

  get currentLang(): string {
    return this.languageService.getCurrentLanguage() || 'en';
  }

  ngOnInit(): void {
    this.setSeo();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.currentLangSig.set(event.lang);
        this.setSeo();
      });
  }

  onServiceApply(serviceId: string): void {
    void this.router.navigate(['/', this.currentLang, 'service-details'], {
      queryParams: { service: serviceId },
    });
  }

  private setSeo(): void {
    this.seo.update({
      title: this.translate.instant('servicesPage.seo.title'),
      description: this.translate.instant('servicesPage.seo.description'),
      keywords: this.translate.instant('servicesPage.seo.keywords'),
      url: this.translate.instant('servicesPage.seo.url'),
      author: this.translate.instant('servicesPage.seo.author'),
      type: 'website',
    });
  }
}
