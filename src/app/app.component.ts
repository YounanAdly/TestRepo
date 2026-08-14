import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { FooterComponent } from "./layouts/footer/footer.component";
import { HeaderComponent } from "./layouts/header/header.component";
import { LanguageService } from './shared/services/language.service';
import { GlobalLoaderComponent } from './shared/components/loader.type';
import { LoginPromptDialogComponent } from './shared/components/login-prompt-dialog/login-prompt-dialog.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterModule, HeaderComponent, FooterComponent, GlobalLoaderComponent, LoginPromptDialogComponent, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'marafiq';
  public languageService = inject(LanguageService);
  private router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly mainContent = viewChild.required<ElementRef>('mainContent');
  hidePublicHeaderOnRoutes = ['/home', '/login', '/create-account', '/select-account'];
  hidePublicFooterOnRoutes = ['/login', '/create-account', '/select-account'];
  hideHeader: boolean = false;
  hideFooter: boolean = false;

  ngOnInit(): void {
    this.hideHeaderFooterOnRouteChange();
    if (isPlatformBrowser(this.languageService.platformId)) {
      this.languageService.waitLanguageLoad();
    }
  }

  skipToContent(event: Event): void {
    event.preventDefault();
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
    }
  }

  hideHeaderFooterOnRouteChange() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        this.hideHeader = this.hidePublicHeaderOnRoutes.some(r => url.includes(r));
        this.hideFooter = this.hidePublicFooterOnRoutes.some(r => url.includes(r));
      });
  }
}
