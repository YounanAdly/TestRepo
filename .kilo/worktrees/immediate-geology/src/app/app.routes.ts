import { Routes } from '@angular/router';
import { HomePageComponent } from './public/home-page/home-page.component';
import { ContactUsComponent } from './public/contact-us/contact-us.component';

export const routes: Routes = [
    {
        path: ':lang',
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: HomePageComponent },
            { path: 'contact-us', component: ContactUsComponent },
        ],
    },
];
