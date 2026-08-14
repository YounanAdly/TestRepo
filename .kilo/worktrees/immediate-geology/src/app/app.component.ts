import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FooterComponent } from "./layouts/footer/footer.component";
import { HeaderComponent } from "./layouts/header/header.component";
import { LanguageService } from './shared/services/language.service';
import { GlobalLoaderComponent } from './shared/components/loader.type';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterModule, HeaderComponent, FooterComponent, GlobalLoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'custom-template';
  public languageService = inject(LanguageService);
  private router = inject(Router);
  @ViewChild('mainContent') mainContent!: ElementRef;
  hidePublicHeaderOnRoutes = ['/contact-us'];
  hideHeader:boolean = false;

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
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        this.hideHeader = this.hidePublicHeaderOnRoutes.some(r => url.includes(r));
        // console.log('Current URL:', url, 'Hide Footer:', this.hideFooter, 'Hide Header:', this.hideHeader);
      });
  }

}
