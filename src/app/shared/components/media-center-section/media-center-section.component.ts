import { A11yModule } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, OnDestroy, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-media-center-section',
  standalone: true,
  imports: [TranslateModule, A11yModule],
  templateUrl: './media-center-section.component.html',
  styleUrl: './media-center-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaCenterSectionComponent implements AfterViewInit, OnDestroy {
  public currentLang = 'en';
  private languageService = inject(LanguageService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly videoModalRef = viewChild<ElementRef<HTMLDivElement>>('videoModal');
  private readonly videoPreviewElementRef = viewChild<ElementRef<HTMLVideoElement>>('videoPreviewElement');

  isVideoPreviewOpen = false;
  mediaPreviewVideoUrl = 'https://www.w3schools.com/tags/mov_bbb.mp4';

  readonly mediaNewsItems = [
    {
      imageSrc: 'assets/images/media-news-1.png',
      imageAltKey: 'home.mediaCenter.cards.newsOne.imageAlt',
      openPreviewLabelKey: 'home.mediaCenter.cards.newsOne.openPreview',
      videoUrl: 'https://www.w3schools.com/tags/mov_bbb.mp4',
    },
    {
      imageSrc: 'assets/images/media-news-2.png',
      imageAltKey: 'home.mediaCenter.cards.newsTwo.imageAlt',
      openPreviewLabelKey: 'home.mediaCenter.cards.newsTwo.openPreview',
      videoUrl: 'https://www.w3schools.com/tags/mov_bbb.mp4',
    },
    {
      imageSrc: 'assets/images/media-news-3.png',
      imageAltKey: 'home.mediaCenter.cards.newsThree.imageAlt',
      openPreviewLabelKey: 'home.mediaCenter.cards.newsThree.openPreview',
      videoUrl: 'https://www.w3schools.com/tags/mov_bbb.mp4',
    },
  ];

  ngAfterViewInit(): void {
    const modal = this.videoModalRef()?.nativeElement;
    if (modal) {
      this.document.body.appendChild(modal);
    }
  }

  ngOnDestroy(): void {
    const modal = this.videoModalRef()?.nativeElement;
    if (modal?.parentNode) {
      modal.parentNode.removeChild(modal);
    }
    this.document.body.style.overflow = '';
  }

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage() || 'en';
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.currentLang = event.lang;
      });
  }

  onViewMoreMediaCenter(): void {
    void this.router.navigate(['/', this.currentLang, 'media-center']);
  }

  openVideoPreview(videoUrl?: string): void {
    if (videoUrl) {
      this.mediaPreviewVideoUrl = videoUrl;
    }
    this.isVideoPreviewOpen = true;
    this.document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
    const player = this.videoPreviewElementRef()?.nativeElement;
    if (player) {
      player.play().catch(() => {});
    }
  }

  closeVideoPreview(): void {
    const player = this.videoPreviewElementRef()?.nativeElement;
    if (player) {
      player.pause();
      player.currentTime = 0;
    }
    this.isVideoPreviewOpen = false;
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isVideoPreviewOpen) {
      this.closeVideoPreview();
    }
  }
}
