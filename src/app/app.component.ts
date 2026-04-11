import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { VoiceComponent } from './components/voice/voice.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [VoiceComponent, LoginComponent, RouterOutlet]
  
})
export class AppComponent {
  title = 'voice-banking';
}
