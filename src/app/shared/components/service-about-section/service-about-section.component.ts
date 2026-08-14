
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

interface ServiceMetaChip {
  iconSrc: string;
  labelKey: string;
  valueKey: string;
  /** When provided, overrides the translated valueKey. */
  directValue?: string | null;
}

@Component({
  selector: 'app-service-about-section',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './service-about-section.component.html',
  styleUrl: './service-about-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceAboutSectionComponent {
  readonly embedded = input(false);
  readonly rootClass = input('');

  /** Direct estimated time text from API (overrides static translation). */
  readonly estimatedTime = input<string | null | undefined>(null);
  /** Direct fees text from API (overrides static translation). */
  readonly fees = input<string | null | undefined>(null);
  /** Direct eligibility text from API (overrides static translation). */
  readonly eligibility = input<string | null | undefined>(null);
  /** Dynamic document names from API (overrides static list when provided). */
  readonly dynamicDocuments = input<string[] | null | undefined>(null);
  /** Backend category number used by request page form selection. */
  readonly serviceName = input<number | null>(null);

  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly metaChips = computed((): ServiceMetaChip[] => [
    {
      iconSrc: 'assets/images/service-icon-clock.svg',
      labelKey: 'home.serviceAbout.meta.estimatedTime.label',
      valueKey: 'home.serviceAbout.meta.estimatedTime.value',
      directValue: this.estimatedTime(),
    },
    {
      iconSrc: 'assets/images/service-icon-fees.svg',
      labelKey: 'home.serviceAbout.meta.fees.label',
      valueKey: 'home.serviceAbout.meta.fees.value',
      directValue: this.fees(),
    },
    {
      iconSrc: 'assets/images/service-icon-eligibility.svg',
      labelKey: 'home.serviceAbout.meta.eligibility.label',
      valueKey: 'home.serviceAbout.meta.eligibility.value',
      directValue: this.eligibility(),
    },
  ]);


  onApplyNow(): void {
    const currentLang = this.languageService.getCurrentLanguage() || 'en';
    const serviceId = this.route.snapshot.queryParamMap.get('service') || 'connection';
    const serviceName = this.serviceName();
    void this.router.navigate(['/', currentLang, 'service-request'], {
      queryParams: {
        service: serviceId,
        ...(serviceName ? { serviceName } : {}),
      },
    });
  }
}
