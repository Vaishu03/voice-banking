import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VoiceComponent } from './components/voice/voice.component';
import { LoginComponent } from './components/login/login.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    // AppComponent,
    // VoiceComponent
  
    // LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    VoiceComponent,
    AppComponent,
    LoginComponent,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
