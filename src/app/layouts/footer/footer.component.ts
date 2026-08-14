
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../shared/services/language.service';

interface FooterNavLink {
  labelKey: string;
  route: string;
}

interface FooterContactInfo {
  icon: 'phone' | 'email' | 'address';
  textKey: string;
  href: string;
}

interface FooterSocialLink {
  platform: 'facebook' | 'x' | 'linkedin';
  href: string;
  ariaLabelKey: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly languageService = inject(LanguageService);

  readonly logoSrc = input('assets/images/logoNav.svg');
  readonly menuLinks = input<FooterNavLink[]>([
    { labelKey: 'footer.menu.aboutUs', route: 'about-us' },
    { labelKey: 'footer.menu.services', route: 'services' },
    { labelKey: 'footer.menu.complaints', route: 'complaints' },
    { labelKey: 'footer.menu.inquiry', route: 'inquiry' },
    { labelKey: 'footer.menu.mediaCenter', route: 'media-center' },
    { labelKey: 'footer.menu.faq', route: 'faq' },
]);
  readonly contactInfo = input<FooterContactInfo[]>([
    { icon: 'phone', textKey: 'footer.contact.phone', href: 'tel:+96822143933' },
    { icon: 'email', textKey: 'footer.contact.email', href: 'mailto:records@marafiq.om' },
    { icon: 'address', textKey: 'footer.contact.address', href: '#' },
]);
  readonly socialLinks = input<FooterSocialLink[]>([
    { platform: 'facebook', href: '#', ariaLabelKey: 'footer.social.facebook' },
    { platform: 'x', href: '#', ariaLabelKey: 'footer.social.x' },
    { platform: 'linkedin', href: '#', ariaLabelKey: 'footer.social.linkedin' },
]);
  readonly legalLinks = input<FooterNavLink[]>([
    { labelKey: 'footer.legal.privacy', route: 'inquiry' },
    { labelKey: 'footer.legal.terms', route: 'inquiry' },
    { labelKey: 'footer.legal.accessibility', route: 'inquiry' },
]);

  readonly year = new Date().getFullYear();

  getLocalizedRoute(route: string): string[] {
    return ['/', this.languageService.getCurrentLanguage(), route];
  }
}
