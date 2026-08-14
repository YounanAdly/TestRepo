import { provideHttpClient, withFetch } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslations } from '../../translate.config';

import { InquiryComponent } from './inquiry.component';

describe('InquiryComponent', () => {
  let component: InquiryComponent;
  let fixture: ComponentFixture<InquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InquiryComponent],
      providers: [provideRouter([]), provideHttpClient(withFetch()), ...provideTranslations()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(InquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
