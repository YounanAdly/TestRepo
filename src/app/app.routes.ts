import { Routes } from '@angular/router';
import { loginPromptGuard } from './shared/guards/login-prompt.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/en/home', pathMatch: 'full' },
    {
        path: ':lang',
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            {
                path: 'home',
                loadComponent: () =>
                    import('./public/home/home.component').then(m => m.HomeComponent),
            },
            {
                path: 'services',
                loadComponent: () =>
                    import('./public/services/services.component').then(m => m.ServicesComponent),
            },
            {
                path: 'service-details',
                loadComponent: () =>
                    import('./public/service-details/service-details.component').then(
                        m => m.ServiceDetailsComponent,
                    ),
            },
            {
                path: 'service-request',
                canActivate: [loginPromptGuard],
                loadComponent: () =>
                    import('./public/service-request/service-request.component').then(
                        m => m.ServiceRequestComponent,
                    ),
            },
            {
                path: 'complaints',
                loadComponent: () =>
                    import('./public/complaints/complaints.component').then(
                        m => m.ComplaintsComponent,
                    ),
            },
            {
                path: 'complaint-request',
                canActivate: [loginPromptGuard],
                loadComponent: () =>
                    import('./public/complaint-request/complaint-request.component').then(
                        m => m.ComplaintRequestComponent,
                    ),
            },
            {
                path: 'notifications',
                canActivate: [loginPromptGuard],
                loadComponent: () =>
                    import('./public/notifications/notifications.component').then(
                        m => m.NotificationsComponent,
                    ),
            },
            {
                path: 'inquiry',
                canActivate: [loginPromptGuard],
                loadComponent: () =>
                    import('./public/inquiry/inquiry.component').then(m => m.InquiryComponent),
            },
            {
                path: 'dashboard',
                canActivate: [loginPromptGuard],
                loadComponent: () =>
                    import('./public/dashboard/dashboard.component').then(
                        m => m.DashboardComponent,
                    ),
            },
            {
                path: 'my-profile',
                canActivate: [loginPromptGuard],
                loadComponent: () =>
                    import('./public/my-profile/my-profile.component').then(
                        m => m.MyProfileComponent,
                    ),
            },
            {
                path: 'account-summary',
                canActivate: [loginPromptGuard],
                loadComponent: () =>
                    import('./public/account-summary/account-summary.component').then(
                        m => m.AccountSummaryComponent,
                    ),
            },
            {
                path: 'view-bills',
                canActivate: [loginPromptGuard],
                loadComponent: () =>
                    import('./public/view-bills/view-bills.component').then(
                        m => m.ViewBillsComponent,
                    ),
            },
            {
                path: 'request-details',
                canActivate: [loginPromptGuard],
                loadComponent: () =>
                    import('./public/request-details/request-details.component').then(
                        m => m.RequestDetailsComponent,
                    ),
            },
            {
                path: 'faq',
                loadComponent: () =>
                    import('./public/faq/faq.component').then(m => m.FaqComponent),
            },
            {
                path: 'login',
                loadComponent: () =>
                    import('./public/login/login.component').then(m => m.LoginComponent),
            },
            {
                path: 'select-account',
                loadComponent: () =>
                    import('./public/select-account/select-account.component').then(
                        m => m.SelectAccountComponent,
                    ),
            },
            {
                path: 'create-account',
                loadComponent: () =>
                    import('./public/create-account/create-account.component').then(
                        m => m.CreateAccountComponent,
                    ),
            },
            {
                path: 'media-center',
                loadComponent: () =>
                    import('./public/media-center/media-center.component').then(
                        m => m.MediaCenterComponent,
                    ),
            },
            {
                path: 'media-center/:id',
                loadComponent: () =>
                    import('./public/media-center-detail/media-center-detail.component').then(
                        m => m.MediaCenterDetailComponent,
                    ),
            },
            {
                path: 'about-us',
                loadComponent: () =>
                    import('./public/about-us/about-us.component').then(m => m.AboutUsComponent),
            },
            {
                path: 'not-found',
                loadComponent: () =>
                    import('./public/not-found/not-found.component').then(
                        m => m.NotFoundComponent,
                    ),
            },
            {
                path: '**',
                loadComponent: () =>
                    import('./public/not-found/not-found.component').then(
                        m => m.NotFoundComponent,
                    ),
            },
        ],
    },
    { path: '**', redirectTo: '/en/not-found' },
];

