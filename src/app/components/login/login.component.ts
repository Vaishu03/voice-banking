import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VoiceRecognitionService } from 'src/app/services/voice.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule,FormsModule]
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private voiceservice: VoiceRecognitionService,
    private router: Router
    ) { }

  login() {
    if ((this.username === 'Raj Kumar' && this.password === 'Raj@1234') 
    || (this.username === 'Vaishnavi' && this.password === 'Vaish@1234') 
    || (this.username === 'New Customer' && this.password === 'Cust@1234')) {

      const loginData = {
        username: this.username,
        password: this.password
      };

      console.log(loginData)
      
      this.voiceservice.login(loginData).subscribe ({
        next: (res:any) => {

          // const result = JSON.stringify(res)
          console.log(res)
          localStorage.setItem('loggedInUser', res);
          this.router.navigate(['/dashboard']);

        },
        error: (err) => console.error(err)
      })

    } else {
      this.errorMessage = 'Invalid credentials';
    }
  }

  voiceLogin() {
    alert('🎤 Voice login coming soon...');
  }
}
