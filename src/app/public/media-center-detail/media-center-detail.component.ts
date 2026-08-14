
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';
type MediaCategory = 'news' | 'gallery' | 'announcement' | 'videos';

interface MediaItem {
  id: number;
  category: MediaCategory;
  imageSrc: string;
  titleKey: string;
  date: string;
}

@Component({
  selector: 'app-media-center-detail',
  standalone: true,
  imports: [RouterModule, TranslateModule],
  templateUrl: './media-center-detail.component.html',
  styleUrl: './media-center-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaCenterDetailComponent implements OnInit {
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  currentLang = 'en';
  item: MediaItem | null = null;

  readonly mediaItems: MediaItem[] = [
    { id: 1, category: 'news',         imageSrc: 'assets/images/media-news-1.png', titleKey: 'mediaCenterPage.items.item1.title', date: 'Mar 05 2026' },
    { id: 2, category: 'gallery',      imageSrc: 'assets/images/media-news-3.png', titleKey: 'mediaCenterPage.items.item2.title', date: 'Mar 05 2026' },
    { id: 3, category: 'announcement', imageSrc: 'assets/images/media-news-2.png', titleKey: 'mediaCenterPage.items.item3.title', date: 'Mar 05 2026' },
    { id: 4, category: 'gallery',      imageSrc: 'assets/images/media-news-3.png', titleKey: 'mediaCenterPage.items.item4.title', date: 'Mar 05 2026' },
    { id: 5, category: 'videos',       imageSrc: 'assets/images/media-news-2.png', titleKey: 'mediaCenterPage.items.item5.title', date: 'Mar 05 2026' },
    { id: 6, category: 'announcement', imageSrc: 'assets/images/media-news-2.png', titleKey: 'mediaCenterPage.items.item6.title', date: 'Mar 05 2026' },
    { id: 7, category: 'videos',       imageSrc: 'assets/images/media-news-1.png', titleKey: 'mediaCenterPage.items.item7.title', date: 'Mar 05 2026' },
    { id: 8, category: 'announcement', imageSrc: 'assets/images/media-news-2.png', titleKey: 'mediaCenterPage.items.item8.title', date: 'Mar 05 2026' },
    { id: 9, category: 'videos',       imageSrc: 'assets/images/media-news-3.png', titleKey: 'mediaCenterPage.items.item9.title', date: 'Mar 05 2026' },
  ];

  get introKey(): string {
    return `mediaCenterPage.items.item${this.item?.id}.intro`;
  }

  get para1Key(): string {
    return `mediaCenterPage.items.item${this.item?.id}.para1`;
  }

  get para2Key(): string {
    return `mediaCenterPage.items.item${this.item?.id}.para2`;
  }

  get quoteTextKey(): string {
    return `mediaCenterPage.items.item${this.item?.id}.quoteText`;
  }

  get quoteAuthorKey(): string {
    return `mediaCenterPage.items.item${this.item?.id}.quoteAuthor`;
  }

  get quoteRoleKey(): string {
    return `mediaCenterPage.items.item${this.item?.id}.quoteRole`;
  }

  get outroKey(): string {
    return `mediaCenterPage.items.item${this.item?.id}.outro`;
  }

  get readTimeKey(): string {
    return `mediaCenterPage.items.item${this.item?.id}.readTime`;
  }

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage() || 'en';

    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.currentLang = event.lang;
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = Number(params.get('id'));
        this.item = this.mediaItems.find(m => m.id === id) ?? null;

        if (!this.item) {
          void this.router.navigate(['/', this.currentLang, 'media-center']);
          return;
        }

        this.seo.update({
          title: this.translate.instant(this.item.titleKey) + ' | Marafiq',
          description: this.translate.instant(this.introKey),
        });
      });
  }

  goBack(): void {
    void this.router.navigate(['/', this.currentLang, 'media-center']);
  }
}
