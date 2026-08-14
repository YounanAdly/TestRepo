import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent implements OnInit {
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  get currentLang(): string {
    return this.languageService.getCurrentLanguage() || 'en';
  }

  ngOnInit(): void {
    this.seo.update({
      title: this.translate.instant('notFound.seo.title'),
      description: this.translate.instant('notFound.seo.description'),
    });
  }

  goHome(): void {
    void this.router.navigate(['/', this.currentLang, 'home']);
  }
}
