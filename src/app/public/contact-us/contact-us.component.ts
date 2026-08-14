import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';

type InquiryStatus = 'approved' | 'pending';

interface InquiryItem {
  id: number;
  dateKey: string;
  status: InquiryStatus;
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.scss',
})
export class ContactUsComponent {
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly subscriptions = new Subscription();

  selectedMonthKey = 'contactUsPage.filters.months.january';
  selectedYearKey = 'contactUsPage.filters.years.y2026';
  attachedFileName = '';

  readonly inquiries: InquiryItem[] = [
    {
      id: 1,
      dateKey: 'contactUsPage.inquiries.items.i1.date',
      status: 'approved',
      titleKey: 'contactUsPage.inquiries.items.i1.title',
      descriptionKey: 'contactUsPage.inquiries.items.i1.description',
    },
    {
      id: 2,
      dateKey: 'contactUsPage.inquiries.items.i2.date',
      status: 'pending',
      titleKey: 'contactUsPage.inquiries.items.i2.title',
      descriptionKey: 'contactUsPage.inquiries.items.i2.description',
    },
    {
      id: 3,
      dateKey: 'contactUsPage.inquiries.items.i3.date',
      status: 'approved',
      titleKey: 'contactUsPage.inquiries.items.i3.title',
      descriptionKey: 'contactUsPage.inquiries.items.i3.description',
    },
    {
      id: 4,
      dateKey: 'contactUsPage.inquiries.items.i4.date',
      status: 'approved',
      titleKey: 'contactUsPage.inquiries.items.i4.title',
      descriptionKey: 'contactUsPage.inquiries.items.i4.description',
    },
  ];

  get currentLang(): string {
    return this.languageService.getCurrentLanguage() || 'en';
  }

  get attachedFileLabelKey(): string {
    return this.attachedFileName ? '' : 'contactUsPage.composer.attach';
  }

  ngOnInit(): void {
    this.setSeo();
    this.subscriptions.add(this.translate.onLangChange.subscribe(() => this.setSeo()));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onBack(): void {
    void this.router.navigate(['/', this.currentLang, 'home']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    this.attachedFileName = file?.name || '';
  }

  trackByInquiryId(_index: number, item: InquiryItem): number {
    return item.id;
  }

  private setSeo(): void {
    this.seo.update({
      title: this.translate.instant('contactUsPage.seo.title'),
      description: this.translate.instant('contactUsPage.seo.description'),
      keywords: this.translate.instant('contactUsPage.seo.keywords'),
      url: this.translate.instant('contactUsPage.seo.url'),
      author: this.translate.instant('contactUsPage.seo.author'),
      type: 'website',
    });
  }

}
