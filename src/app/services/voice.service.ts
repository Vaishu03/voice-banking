import { HttpClient } from '@angular/common/http';
import { Injectable, EventEmitter,NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
 
declare var webkitSpeechRecognition: any;

 
@Injectable({
  providedIn: 'root'
})
export class VoiceRecognitionService {
  recognition: any;
  isListening = false;
  text = '';
  private http = inject(HttpClient);

  constructor(private ngZone: NgZone) {
    
    // const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // if (SpeechRecognition) {
    //   this.recognition = new SpeechRecognition();
    //   this.recognition.continuous = true;
    //   this.recognition.interimResults = true;
    //   this.recognition.lang = 'en-US'; // change language here
    //   this.recognition.onresult = (event: any) => {
    //     this.ngZone.run(() => {
    //       let finalText = '';
    //       for (let i = event.resultIndex; i < event.results.length; i++) {
    //         finalText += event.results[i][0].transcript;
    //       }
    //       this.text = finalText;
    //       console.log("You said: ",this.text);
    //     });
    //   };
    //   this.recognition.onerror = (event: any) => {
    //     console.error('Speech recognition error:', event.error);
    //   };
    //   this.recognition.onend = () => {
    //     if (this.isListening) {
    //       this.recognition.start(); // auto restart
    //     }
    //   };
    // } else {
    //   alert('Speech Recognition not supported in this browser');
    // }
  }
  start() {
    if (this.recognition) {
      this.isListening = true;
      this.recognition.start();
    }
  }
  stop() {
    if (this.recognition) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  login(userdata:any): Observable<any> {
    return this.http.post('/api/login', userdata, {responseType: 'text'});
  }

  api_balance(cif:any): Observable<any> {
    // console.log("http", this.http);
    return this.http.get(`/api/getbalance/${cif}`, { responseType: 'text' });
  }

  api_getlastfivetransactions(cif:any): Observable<any> {
    return this.http.get(`/api/getlastfivetransactions/${cif}`, { responseType: 'text' });
  }

  api_transfer(amount:any): Observable<any> {
    return this.http.post(`/api/transfer`, amount, { responseType: 'text' });
  }

  api_test(): Observable<any> {
    return this.http.get(`/api/voice`, { responseType: 'text' });
  }

  api_credit(cif:any): Observable<any> {
    return this.http.get(`/api/getCreditcarddetails/${cif}`, { responseType: 'text' });
  }

  api_debit(cif:any): Observable<any> {
    return this.http.get(`/api/debit_card_facility/${cif}`, { responseType: 'text' });
  }

  api_debitcard(cif:any): Observable<any> {
    return this.http.get(`/api/debitcarddetails/${cif}`, { responseType: 'text' });
  }

  api_aadhar (cif:any): Observable<any> {
    return this.http.get(`/api/aadhar_linkage/${cif}`, { responseType: 'text' });
  }

  api_kyc(cif:any): Observable<any> {
    return this.http.get(`/api/kycEnquiry/${cif}`, { responseType: 'text' });
  }

  api_inb(cif:any): Observable<any> {
    return this.http.get(`/api/inb_facility/${cif}`, { responseType: 'text' });
  }

  api_nominee(cif:any): Observable<any> {
    return this.http.get(`/api/nomineefacility/${cif}`, { responseType: 'text' });
  }

  api_nomineeDetails(cif:any): Observable<any> {
    return this.http.get(`/api/nomineedetails/${cif}`, { responseType: 'text' });
  }
 }


































//   recognition = new webkitSpeechRecognition();
//   public text = '';
//   isListening = false;
//   public tempWords: string = '';
//   public speechToTextResult = new EventEmitter<string>();
 
//   constructor() { }
 
//   init() {
//     this.recognition.interimResults = true;
//     this.recognition.lang = 'en-US'; // Set language
 
//     this.recognition.addEventListener('result', (event: any) => {
//       const transcript = Array.from(event.results)
//         .map((result: any) => result[0].transcript)
//         .join('');
//       this.tempWords = transcript;
//       if (event.results[0].isFinal) {
//         this.text += transcript + ' ';
//         this.tempWords = '';
//         this.speechToTextResult.emit(this.text); // Emit final result
//       }
//     });
 
//     this.recognition.addEventListener('end', (reason: any) => {
//         // Handle the end of recognition
//     });
//   }
 
//   start() {
//     this.recognition.start();
//     console.log('Voice recognition started');
//   }
 
//   stop() {
//     this.recognition.stop();
//     console.log('Voice recognition stopped');
//   }
// }