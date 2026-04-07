import { Component, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { SpeechToTextModule, SpeechToTextComponent, ErrorEventArgs, StopListeningEventArgs, TranscriptChangedEventArgs } from '@syncfusion/ej2-angular-inputs';
import { DropDownListModule, ChangeEventArgs as DDLChangeEventArgs } from '@syncfusion/ej2-angular-dropdowns';
import { SwitchModule, ButtonModule, ChangeEventArgs } from '@syncfusion/ej2-angular-buttons';
import { VoiceRecognitionService } from 'src/app/services/voice.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-voice',
    templateUrl: 'voice.component.html',
    styleUrls: ['voice.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, SpeechToTextModule, SwitchModule, ButtonModule, DropDownListModule]
})
export class VoiceComponent implements OnInit {

    @ViewChild('speechToText') speechToText!: SpeechToTextComponent;

    /* ✅ NEW: Track selected language */
    selectedLanguage: string = 'en-IN';

    public colorsData: Object[] = [
        { text: 'Normal', value: '' },
        { text: 'Primary', value: 'e-primary' },
        { text: 'Success', value: 'e-success' },
        { text: 'Warning', value: 'e-warning' },
        { text: 'Danger', value: 'e-danger' }
    ];

    public languageData: Object[] = [
        { text: 'English (India)', value: 'en-IN' },
        { text: 'Hindi', value: 'hi-IN' },
        { text: 'Telugu', value: 'te-IN' },
        { text: 'Tamil', value: 'ta-IN' },
        { text: 'Marathi', value: 'mr-IN' }
    ];

    public fields: Object = { text: 'text', value: 'value' };

    listening: boolean = false;
    liveTranscript: string = '';
    statusText: string = 'Tap mic to speak';
    copyButtonText: string = 'Copy';
    messages: { sender: 'user' | 'bot', text: string }[] = [];
    lastProcessedtext: string = '';


    constructor(private voiceservice: VoiceRecognitionService) { }

    ngOnInit(): void {
        console.log("Voice Banking Loaded");
        setInterval(() => {
            this.isSpeaking = speechSynthesis.speaking;
        }, 500);

        const text = "Welcome to yono Voice banking, Please say your preferred language";
        this.speak(text, 'en-IN');
        console.log(text);
        // this.loadvoices();
        // this.onListeningStart();

    }



    /* 🎤 Speech Result */
    onTranscriptChange(args: TranscriptChangedEventArgs): void {
        if (!args.isInterimResult) {

            let fulltext = args.transcript.toLowerCase().trim();

            let text = fulltext.replace(this.lastProcessedtext, '').trim();

            this.lastProcessedtext = fulltext;

            console.log("Transcript:", text);

            if (!text) return;

            if (!this.languageSelected) {
                this.detectLanguage(text);
                return;
            }


            this.messages = [];

            // ✅ Add user message
            this.messages.push({ sender: 'user', text });

            this.api_test(text, this.selectedLanguage);
            // text = ''
        }
    }

    languageSelected = false;

    detectLanguage(text: string) {

        if (text.includes('english')) {
            this.selectedLanguage = 'en-IN';
        }
        else if (text.includes('hindi')) {
            this.selectedLanguage = 'hi-IN';
        }
        else if (text.includes('telugu')) {
            this.selectedLanguage = 'te-IN';
        }
        else if (text.includes('tamil')) {
            this.selectedLanguage = 'ta-IN';
        }
        else if (text.includes('marathi')) {
            this.selectedLanguage = 'mr-IN';
        }
        else {
            // ❌ Not understood
            this.speak("Sorry, I didn't understand. Please say English, Hindi or Telugu.", 'en-IN');
            return;
        }

        // ✅ Language selected
        this.languageSelected = true;

        this.speechToText.lang = this.selectedLanguage;

        const confirmText = `You selected ${text}. How can I help you?`;

        this.messages.push({ sender: 'bot', text: confirmText });
        this.speak(confirmText, this.selectedLanguage);

        console.log("Language set to:", this.selectedLanguage);
    }

    /* 🎨 Mic Color */
    onMicColorChange(args: DDLChangeEventArgs): void {
        if (this.speechToText) {
            this.speechToText.cssClass = args.value.toString();
        }
    }

    /* 🌐 Language Change (VERY IMPORTANT FIX) */
    onLanguageChange(args: DDLChangeEventArgs): void {
        this.selectedLanguage = args.value.toString();

        if (this.speechToText) {
            this.speechToText.lang = this.selectedLanguage;
        }

        this.languageSelected = true;

        console.log("Language switched to:", this.selectedLanguage);
    }

    toggleInterimResults(args: ChangeEventArgs): void {
        if (this.speechToText) {
            this.speechToText.allowInterimResults = args.checked ?? false;
        }
    }

    toggleTooltip(args: ChangeEventArgs): void {
        if (this.speechToText) {
            this.speechToText.showTooltip = args.checked ?? false;
        }
    }

    /* 🎤 Mic Events */
    onListeningStart(): void {
        this.listening = true;
        this.statusText = '🎙 Listening... Speak now...';
    }

    onListeningStop(args: any): void {
        this.listening = false;
        this.statusText = 'Tap mic to speak';
    }

    onErrorHandler(args: any): void {
        console.error("Speech Error:", args?.errorMessage || args);
        this.statusText = args?.errorMessage || 'Speech error occurred';
    }

    /* 📋 Copy */
    copyTranscript(): void {
        if (this.liveTranscript && navigator.clipboard) {
            navigator.clipboard.writeText(this.liveTranscript);
            this.copyButtonText = 'Copied!';
            setTimeout(() => this.copyButtonText = 'Copy', 2000);
        }
    }

    /* 🧹 Clear */
    clearTranscript(): void {

        // ✅ Clear chat بالكامل
        this.messages = [];

        // ✅ Clear live transcript (optional)
        this.liveTranscript = '';

        // ✅ Reset speech component
        if (this.speechToText) {
            this.speechToText.transcript = '';
        }

        // ✅ Stop any ongoing speech
        speechSynthesis.cancel();
    }

    /* ⚡ Quick Actions */
    triggerAction(type: string) {
        this.api_test(type, this.selectedLanguage);
    }

    loadvoices() {
        let voices: SpeechSynthesisVoice[] = [];

        speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices();
        }
    }

    isSpeaking = false;

    speak(text: string, lang: string) {
        // console.log("Speaking")

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        this.isSpeaking = true;

        utterance.lang = lang;

        // const voices = speechSynthesis.getVoices();

        // const selectedVoice = voices.find(v=>
        //     v.lang.toLowerCase().includes(lang.toLowerCase())
        // );

        // if (selectedVoice) {
        //     utterance.voice = selectedVoice;
        // }

        // 🎧 Make it softer
        utterance.rate = 0.8;   // slower = softer
        utterance.pitch = 1.2;  // slightly higher = pleasant
        utterance.volume = 1;

        utterance.onend = () => {
            this.isSpeaking = false
            // this.onListeningStart(); 
        };
        utterance.onerror = () => this.isSpeaking = false;

        speechSynthesis.speak(utterance);
    }

    /* 🚀 CORE MULTILINGUAL LOGIC */
    api_test(text: string, lang: string) {

        const lowerText = text.toLowerCase();

        // 🔹 Keywords
        const keywords: any = {
            balance: [
                'balance', 'bal', 'amount', 'rupees',
                'कितना है', 'बैलेंस', 'पैसे', 'धन', 'कितना', // Hindi
                'బ్యాలెన్స్', 'డబ్బులు', 'ఎంత', 'నిల్వ', // Telugu
                'மீதி', 'பணம்', 'எவ்வளவு', // Tamil
                'शिल्लक', 'पैसे', 'किती', 'बॅलन्स' // Marathi
            ],
            statement: [
                'statement', 'history', 'transactions', 'mini statement',
                'स्टेटमेंट', 'लेनदेन', 'विवरण', 'ट्रांजैक्शन', // Hindi
                'స్టేట్మెంట్', 'లావాదేవీలు', 'చరిత్ర', // Telugu
                'அறிக்கை', 'பரிவர்த்தனை', // Tamil
                'स्टेटमेंट', 'व्यवहार' // Marathi
            ],
            credit_card: [
                'credit card', 'credit', 'card limit',
                'क्रेडिट कार्ड', 'कार्ड', // Hindi
                'క్రెడిట్ కార్డ్', 'కార్డ్', 'కార్డు', 'క్రెడిట్ కార్డు', // Telugu
                'கிரெடிட் கார்டு', // Tamil
                'क्रेडिट कार्ड' // Marathi
            ]
        };

        // 🔹 Intent Detection
        const isBalance = keywords.balance.some((k: string) => lowerText.includes(k));
        const isStatement = keywords.statement.some((k: string) => lowerText.includes(k));
        // const isTransfer = keywords.transfer.some((k: string) => lowerText.includes(k));
        const iscreditcard = keywords.credit_card.some((k: string) => lowerText.includes(k));

        // ✅ BALANCE API
        if (isBalance) {

            this.voiceservice.api_balance().subscribe({
                next: (res: any) => {

                    const data = typeof res === 'string' ? JSON.parse(res) : res;

                    // 3. Access the value (ensure the key matches your Java map)
                    const balanceValue = data.balance;

                    if (this.selectedLanguage === 'hi-IN') {
                        text = `आपके खाते में शेष राशि ${balanceValue} रुपये है।`;
                    } else if (this.selectedLanguage === 'te-IN') {
                        text = `మీ ఖాతాలో నిల్వ ${balanceValue} రూపాయలు మాత్రమే.`;
                    } else if (this.selectedLanguage === 'ta-IN') {
                        text = `உங்கள் கணக்கில் உள்ள மீதி தொகை ${balanceValue} ரூபாய் மட்டுமே.`;
                    } else if (this.selectedLanguage === 'mr-IN') {
                        text = `तुमच्या खात्यातील शिल्लक ${balanceValue} रुपये आहे.`;
                    } else {
                        text = `Your account balance is ${balanceValue} rupees only.`;
                    }

                    // const balance = res.balance || res; // support both formats
                    // const responseText = `Your account balance is ₹${balanceValue} only`;
                    // this.clearTranscript();

                    this.messages.push({ sender: 'bot', text: text });
                    this.speak(text, this.selectedLanguage);
                },
                error: (err) => console.error(err)
            });

        }

        // ✅ STATEMENT API
        else if (isStatement) {
            console.log(lowerText)

            this.voiceservice.api_statement().subscribe({
                next: (res: any) => {

                    console.log(res)

                    const data = typeof res === 'string' ? JSON.parse(res) : res;

                    let responseText = ''

                    if (this.selectedLanguage === 'hi-IN') {
                        responseText = "आपके हालिया लेनदेन यहाँ हैं: ";
                        data.forEach((txn: any) => {
                            const type = txn.amount > 0 ? "जमा किए गए" : "निकाले गए";
                            responseText += `तारीख: ${txn.date}, ${txn.description} द्वारा ${Math.abs(txn.amount)} रुपये ${type}। `;
                        });
                    } else if (this.selectedLanguage === 'te-IN') {
                        responseText = "మీ ఇటీవలి లావాదేవీలు ఇక్కడ ఉన్నాయి: ";
                        data.forEach((txn: any) => {
                            const type = txn.amount > 0 ? "క్రెడిట్ చేయబడింది" : "డెబిట్ చేయబడింది";
                            responseText += `తేదీ: ${txn.date}, ${txn.description} ద్వారా ${Math.abs(txn.amount)} రూపాయలు ${type}। `;
                        });
                    } else if (this.selectedLanguage === 'ta-IN') {
                        responseText = "உங்கள் சமீபத்திய பரிவர்த்தனைகள் இங்கே: ";
                        data.forEach((txn: any) => {
                            const type = txn.amount > 0 ? "வரவு வைக்கப்பட்டது" : "பற்று வைக்கப்பட்டது";
                            responseText += `தேதி: ${txn.date}, ${txn.description} மூலம் ${Math.abs(txn.amount)} ரூபாய் ${type}। `;
                        });
                    } else if (this.selectedLanguage === 'mr-IN') {
                        responseText = "तुमचे अलीकडील व्यवहार येथे आहेत: ";
                        data.forEach((txn: any) => {
                            const type = txn.amount > 0 ? "जमा झाले" : "खर्च झाले";
                            responseText += `तारीख: ${txn.date}, ${txn.description} द्वारे ${Math.abs(txn.amount)} रुपये ${type}। `;
                        });
                    } else {
                        responseText = "Here are your recent transactions: ";
                        data.forEach((txn: any) => {
                            const action = txn.amount > 0 ? "credited from" : "debited to";
                            responseText += `Date: ${txn.date}, amount ${Math.abs(txn.amount)} rupees ${action} ${txn.description} account. `;
                        });
                    }


                    this.messages.push({ sender: 'bot', text: responseText });
                    this.speak(responseText, lang);
                },
                error: (err) => console.error(err)
            });

        }

        // ✅ TRANSFER API
        // else if (isTransfer) {
        //     console.log(lowerText)


        //     // 🔥 Extract amount (basic logic)
        //     const amountMatch = lowerText.match(/\d+/);
        //     const amount = amountMatch ? amountMatch[0] : 1000;

        //     const payload = {
        //         toAccount: "1234567890", // dummy
        //         amount: amount
        //     };

        //     this.voiceservice.api_transfer(payload).subscribe({
        //         next: (res: any) => {

        //             const responseText = res.message || `₹${amount} transferred successfully`;

        //             this.messages.push({ sender: 'bot', text: responseText });
        //             this.speak(responseText, lang);
        //             this.messages = [];
        //         },
        //         error: (err) => console.error(err)
        //     });

        // }

        else if (iscreditcard) {
            this.voiceservice.api_credit().subscribe({
                next: (res: any) => {

                    const data = typeof res === 'string' ? JSON.parse(res) : res;


                    if (this.selectedLanguage === 'hi-IN') {
                        text = `आपके क्रेडिट कार्ड की कुल सीमा ${data.totallimit} है, बकाया राशि ${data.curroutstandingamount} है और देय तिथि ${data.Duedate} है।`;
                    } else if (this.selectedLanguage === 'te-IN') {
                        text = `మీ క్రెడిట్ కార్డ్ మొత్తం పరిమితి ${data.totallimit}, బాకీ ఉన్న మొత్తం ${data.curroutstandingamount} మరియు చెల్లింపు గడువు తేదీ ${data.Duedate}.`;
                    } else if (this.selectedLanguage === 'ta-IN') {
                        text = `உங்கள் கிரெடிட் கார்டு வரம்பு ${data.totallimit}, நிலுவையில் உள்ள தொகை ${data.curroutstandingamount} மற்றும் கடைசி தேதி ${data.Duedate}.`;
                    } else if (this.selectedLanguage === 'mr-IN') {
                        text = `तुमच्या क्रेडिट कार्डची एकूण मर्यादा ${data.totallimit} आहे, थकबाकी ${data.curroutstandingamount} आहे आणि देय तारीख ${data.Duedate} आहे.`;
                    } else {
                        text = `Total limit of your credit card is ${data.totallimit}, outstanding amount is ${data.curroutstandingamount} and due date is ${data.Duedate}`;
                    }

                    this.messages.push({ sender: 'bot', text: text });
                    this.speak(text, this.selectedLanguage);
                },
                error: (err) => console.error(err)
            });
        }

        // ❌ FALLBACK
        else {

            let responseText: string;

            if (this.selectedLanguage === 'hi-IN') {
                responseText = "क्षमा करें, मुझे समझ नहीं आया। मैं केवल बैलेंस, स्टेटमेंट या क्रेडिट कार्ड जैसी बैंकिंग सेवाओं में मदद कर सकता हूँ।";
            }
            else if (this.selectedLanguage === 'te-IN') {
                responseText = "క్షమించండి, నాకు అర్థం కాలేదు. నేను బ్యాలెన్స్, స్టేట్‌మెంట్ లేదా క్రెడిట్ కార్డ్ వంటి బ్యాంకింగ్ సేవల గురించి మాత్రమే సమాధానం చెప్పగలను.";
            }
            else if (this.selectedLanguage === 'ta-IN') {
                responseText = "மன்னிக்கவும், எனக்கு புரியவில்லை. பேலன்ஸ், ஸ்டேட்மெண்ட் அல்லது கிரெடிட் கார்டு போன்ற வங்கிச் சேவைகளைப் பற்றி மட்டுமே என்னால் பதிலளிக்க முடியும்.";
            }
            else if (this.selectedLanguage === 'mr-IN') {
                responseText = "क्षमस्व, मला समजले नाही. मी फक्त बॅलन्स, स्टेटमेंट किंवा क्रेडिट कार्ड यांसारख्या बँकिंग सेवांबद्दल माहिती देऊ शकतो.";
            }
            else {
                // Default English
                responseText = "Sorry, I didn’t understand. I can only answer about banking services like balance, statement, or credit card.";
            }

            this.messages.push({ sender: 'bot', text: responseText });
            this.speak(responseText, this.selectedLanguage);


            this.messages.push({ sender: 'bot', text: responseText });
            this.speak(responseText, lang);
        }
    }
}