import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { FormlyConfigModule } from '../../shared/formly/formly-config.module';
import { provideTranslations } from '../../translate.config';
import { CreateAccountComponent } from './create-account.component';

describe('CreateAccountComponent', () => {
  let component: CreateAccountComponent;
  let fixture: ComponentFixture<CreateAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAccountComponent, FormlyConfigModule],
      providers: [provideRouter([]), provideHttpClient(withFetch()), ...provideTranslations()]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});