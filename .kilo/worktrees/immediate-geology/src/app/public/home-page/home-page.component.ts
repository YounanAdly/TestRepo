import { AsyncPipe } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InputMaskModule } from 'primeng/inputmask';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Constants } from '../../constants';
import { MapComponent } from '../../shared/components/maps.type';
import { BaseCrudService } from '../../shared/services/base-crud.service';
import { FontSizeService } from '../../shared/services/font-size.service';
import { FormlyService } from '../../shared/services/formly.service';
import { LanguageService } from '../../shared/services/language.service';
import { SeoService } from '../../shared/services/seo.service';
import { ThemeService } from '../../shared/services/theme.service';
import formConfig from './form.json';
import { RouterModule } from '@angular/router';

export interface DropdownValue {
  value: string;
  label: string;
}

// Represents a dropdown field
export interface DropdownField {
  fieldName: string;
  dropdownValues: DropdownValue[];
}

@Component({
  selector: 'app-home-page',
  imports: [ReactiveFormsModule, FormlyModule, TranslateModule, FormsModule, InputMaskModule, AsyncPipe, MapComponent, RouterModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  currentLang = '';
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService);
  public fontService = inject(FontSizeService)
  private baseCrudService = inject(BaseCrudService);
  private formlyService = inject(FormlyService);
  private platformId = inject(PLATFORM_ID);
  private seo = inject(SeoService);
  translate = inject(TranslateService);

  form!: FormGroup;
  users$!: Observable<DropdownField[]>;
  Data$!: Observable<any[]>;
  model = { name: '' };

  fields: FormlyFieldConfig[] = [];
  value: string = '99-999999';

  ngOnInit() {
    this.currentLang = this.languageService.getCurrentLanguage();
    this.loadPage();
    this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
      this.loadPage();
    })
  }

  async loadPage() {
    this.form = new FormGroup({});
    this.fields = formConfig;
    this.users$ = this.baseCrudService.get(Constants.API_URL);
    this.formlyService.setDropdownValue(this.fields, 'country', [{ label: 'New York', value: 'NY' }, { label: 'lebanon', value: 'LB' },]);
    this.setSeo();
  }

  setSeo() {
    this.seo.update({
      title: this.translate.instant('home.seo.title'),
      description: this.translate.instant('home.seo.description'),
      keywords: this.translate.instant('home.seo.keywords'),
      url: this.translate.instant(environment.AppConfig.apiBaseUrl + 'home.seo.url'),
      author: this.translate.instant('home.seo.author'),
      type: 'website',
    });
  }

  // This method toggles the theme between light and dark
  toggleTheme() {
    const current = this.themeService.getTheme();
    if (!this.themeService.isConfiguredThemeEnabled(current)) {
      return;
    }
    this.themeService.setTheme(current);
  }

  applyThemeButton(theme: string) {
    if (!this.themeService.isConfiguredThemeEnabled(theme)) {
      return;
    }
    this.themeService.setTheme(theme);
  }

  toggleLanguage() {
    const activeLang = this.languageService.getCurrentLanguage() || this.currentLang || 'en';
    const newLang = activeLang === 'en' ? 'ar' : 'en';
    this.languageService.changeLanguage(newLang);
    this.currentLang = newLang;
  }

  submit() {
    if(this.form.valid) {
      console.log(this.model);
    }
  }

}
