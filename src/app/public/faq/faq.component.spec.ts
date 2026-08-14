import { provideHttpClient, withFetch } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslations } from '../../translate.config';

import { FaqComponent } from './faq.component';

describe('FaqComponent', () => {
  let component: FaqComponent;
  let fixture: ComponentFixture<FaqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqComponent],
      providers: [provideRouter([]), provideHttpClient(withFetch()), ...provideTranslations()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
