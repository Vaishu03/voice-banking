import { Component } from '@angular/core';
import { VoiceComponent } from './components/voice/voice.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [VoiceComponent]
  
})
export class AppComponent {
  title = 'voice-banking';
}
