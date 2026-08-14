import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { LanguageService } from '../../shared/services/language.service';
import { ThemeService } from '../../shared/services/theme.service';
import { FontSizeService } from '../../shared/services/font-size.service';
import { SeoService } from '../../shared/services/seo.service';
import { provideTranslations } from '../../translate.config';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(withFetch()),
        provideRouter([]),
        ...provideTranslations(),
        {
          provide: LanguageService,
          useValue: {
            getCurrentLanguage: () => 'en',
            changeLanguage: () => undefined,
          },
        },
        {
          provide: ThemeService,
          useValue: {
            isConfiguredThemeEnabled: () => true,
            setTheme: () => undefined,
          },
        },
        {
          provide: FontSizeService,
          useValue: {
            increase: () => undefined,
            decrease: () => undefined,
            reset: () => undefined,
          },
        },
        {
          provide: SeoService,
          useValue: {
            update: () => undefined,
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});