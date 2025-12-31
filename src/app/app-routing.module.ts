import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlankLayoutComponent } from './layouts/blank-layout/blank-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // 🔓 No sidebar / navbar
  {
    path: '',
    component: BlankLayoutComponent,
    children: [
      {
        path: 'login',
        loadChildren: () =>
          import('./login/login.module').then(m => m.LoginModule),
      },
      {
        path: 'register',
        loadChildren: () =>
          import('./register/register.module').then(m => m.RegisterModule),
      },
    ],
  },

  // 🔐 With sidebar / navbar
  {
    path: '',
    component: AdminLayoutComponent,
     canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./layouts/admin-layout/admin-layout.module')
            .then(m => m.AdminLayoutModule),
      },
      {
        path: 'sensors',
        loadChildren: () =>
          import('./sensors/sensors.module').then(m => m.SensorsModule),
      },
    ],
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
