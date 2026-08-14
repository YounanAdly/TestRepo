
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';
type MediaCategory = 'news' | 'gallery' | 'announcement' | 'videos';
type FilterTab = 'all' | 'news' | 'videos' | 'announcements' | 'gallery';
type ViewMode = 'grid' | 'list';
type SortOrder = 'latest' | 'oldest';

interface MediaItem {
  id: number;
  category: MediaCategory;
  imageSrc: string;
  titleKey: string;
  date: string;
}

@Component({
  selector: 'app-media-center',
  standalone: true,
  imports: [RouterModule, TranslateModule],
  templateUrl: './media-center.component.html',
  styleUrl: './media-center.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaCenterComponent implements OnInit {
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  currentLang = 'en';
  activeFilter: FilterTab = 'all';
  viewMode: ViewMode = 'grid';
  sortOrder: SortOrder = 'latest';
  sortDropdownOpen = false;
  categoryDropdownOpen = false;
  currentPage = 1;
  readonly totalResults = 36;
  readonly pageSize = 9;

  readonly tabs: { key: FilterTab; labelKey: string; iconKey: string }[] = [
    { key: 'all',           labelKey: 'mediaCenterPage.tabs.all',           iconKey: 'all' },
    { key: 'news',          labelKey: 'mediaCenterPage.tabs.news',          iconKey: 'news' },
    { key: 'videos',        labelKey: 'mediaCenterPage.tabs.videos',        iconKey: 'videos' },
    { key: 'announcements', labelKey: 'mediaCenterPage.tabs.announcements', iconKey: 'announcements' },
    { key: 'gallery',       labelKey: 'mediaCenterPage.tabs.gallery',       iconKey: 'gallery' },
  ];

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

  get filteredItems(): MediaItem[] {
    const base = this.activeFilter === 'all'
      ? this.mediaItems
      : this.mediaItems.filter(item => {
          const cat: MediaCategory = this.activeFilter === 'announcements' ? 'announcement' : (this.activeFilter as MediaCategory);
          return item.category === cat;
        });
    return this.sortOrder === 'oldest' ? [...base].reverse() : base;
  }

  get totalPages(): number {
    return Math.ceil(this.totalResults / this.pageSize);
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage() || 'en';
    this.seo.update({
        title: this.translate.instant('mediaCenterPage.seo.title'),
        description: this.translate.instant('mediaCenterPage.seo.description'),
      });
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.currentLang = event.lang;
      });
  }

  setFilter(tab: FilterTab): void {
    this.activeFilter = tab;
    this.categoryDropdownOpen = false;
    this.currentPage = 1;
  }

  toggleCategoryDropdown(): void {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
    this.sortDropdownOpen = false;
  }

  setSortOrder(order: SortOrder): void {
    this.sortOrder = order;
    this.sortDropdownOpen = false;
    this.currentPage = 1;
  }

  toggleSortDropdown(): void {
    this.sortDropdownOpen = !this.sortDropdownOpen;
    this.categoryDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.mc-dropdown--sort')) {
      this.sortDropdownOpen = false;
    }
    if (!target.closest('.mc-dropdown--category')) {
      this.categoryDropdownOpen = false;
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openDetail(item: MediaItem): void {
    void this.router.navigate(['/', this.currentLang, 'media-center', item.id]);
  }

  goBack(): void {
    void this.router.navigate(['/', this.currentLang, 'home']);
  }
}
