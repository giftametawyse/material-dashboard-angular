import { Routes } from '@angular/router';

import { DashboardComponent } from '../../dashboard/dashboard.component';
import { UserProfileComponent } from '../../user-profile/user-profile.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { HumidityComponent } from '../../sensors/humidity/humidity.component';
import { VoltageComponent } from '../../sensors/voltage/voltage.component';
import { OxygenComponent } from '../../sensors/oxygen/oxygen.component';
import { HydrogenComponent } from '../../sensors/hydrogen/hydrogen.component';
import { TemperatureComponent } from 'app/sensors/temperature/temperature.component';
export const AdminLayoutRoutes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    
    // {
    //   path: '',
    //   children: [ {
    //     path: 'dashboard',
    //     component: DashboardComponent
    // }]}, {
    // path: '',
    // children: [ {
    //   path: 'userprofile',
    //   component: UserProfileComponent
    // }]
    // }, {
    //   path: '',
    //   children: [ {
    //     path: 'icons',
    //     component: IconsComponent
    //     }]
    // }, {
    //     path: '',
    //     children: [ {
    //         path: 'notifications',
    //         component: NotificationsComponent
    //     }]
    // }, {
    //     path: '',
    //     children: [ {
    //         path: 'maps',
    //         component: MapsComponent
    //     }]
    // }, {
    //     path: '',
    //     children: [ {
    //         path: 'login',
    //         component: TypographyComponent
    //     }]
    // }, {
    //     path: '',
    //     children: [ {
    //         path: 'upgrade',
    //         component: UpgradeComponent
    //     }]
    // }
    { path: 'dashboard',      component: DashboardComponent },
    { path: 'user-profile',   component: UserProfileComponent },
    { path: 'notifications',  component: NotificationsComponent },
    { path: 'humidity', component: HumidityComponent },
    { path: 'voltage', component: VoltageComponent },
    { path: 'oxygen', component: OxygenComponent },
    { path: 'hydrogen', component: HydrogenComponent },
    { path: 'temperature', component: TemperatureComponent},
];
