import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HumidityComponent } from './humidity/humidity.component';
import { OxygenComponent } from './oxygen/oxygen.component';
import { VoltageComponent } from './voltage/voltage.component';
import { HydrogenComponent } from './hydrogen/hydrogen.component';
import { FormsModule } from '@angular/forms';
import { SensorsRoutingModule } from './sensors-routing.module';
import { TemperatureComponent } from './temperature/temperature.component';

@NgModule({
  declarations: [
    HumidityComponent,
    VoltageComponent,
    OxygenComponent,
    HydrogenComponent,
    TemperatureComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SensorsRoutingModule
  ],
  exports: [
    //TableListComponent,
    HumidityComponent,
    OxygenComponent,
    VoltageComponent,
    HydrogenComponent,
  ]
})
export class SensorsModule { }
