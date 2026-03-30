import { Injectable, EventEmitter,NgZone } from '@angular/core';
 
declare var webkitSpeechRecognition: any;

 
@Injectable({
  providedIn: 'root'
})
export class VoiceRecognitionService {
  recognition: any;
  isListening = false;
  text = '';
  constructor(private ngZone: NgZone) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US'; // change language here
      this.recognition.onresult = (event: any) => {
        this.ngZone.run(() => {
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            finalText += event.results[i][0].transcript;
          }
          this.text = finalText;
          console.log("You said: ",this.text);
        });
      };
      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
      this.recognition.onend = () => {
        if (this.isListening) {
          this.recognition.start(); // auto restart
        }
      };
    } else {
      alert('Speech Recognition not supported in this browser');
    }
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