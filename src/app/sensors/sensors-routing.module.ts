import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HumidityComponent } from './humidity/humidity.component';
import { VoltageComponent } from './voltage/voltage.component';
import { OxygenComponent } from './oxygen/oxygen.component';
import { HydrogenComponent } from './hydrogen/hydrogen.component';
import { TemperatureComponent } from './temperature/temperature.component';

const routes: Routes = [
  { path: 'humidity', component: HumidityComponent },
  { path: 'voltage', component: VoltageComponent },
  { path: 'oxygen', component: OxygenComponent },
  { path: 'hydrogen', component: HydrogenComponent },
  { path: 'temperature', component: TemperatureComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SensorsRoutingModule {}
