import { Component, ViewEncapsulation, ViewChild, OnInit } from '@angular/core';
import { SpeechToTextModule, SpeechToTextComponent, ErrorEventArgs, StopListeningEventArgs, TranscriptChangedEventArgs } from '@syncfusion/ej2-angular-inputs';
import { DropDownListModule, ChangeEventArgs as DDLChangeEventArgs } from '@syncfusion/ej2-angular-dropdowns';
import { SwitchModule, ButtonModule, ChangeEventArgs } from '@syncfusion/ej2-angular-buttons';
import { VoiceRecognitionService } from 'src/app/services/voice.service';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-voice',
    templateUrl: 'voice.component.html',
    styleUrls: ['voice.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, SpeechToTextModule, SwitchModule, ButtonModule, DropDownListModule, DatePipe],
    providers: [DatePipe]
})
export class VoiceComponent implements OnInit {

    @ViewChild('speechToText') speechToText!: SpeechToTextComponent;

    /* ✅ NEW: Track selected language */
    selectedLanguage: string = '';

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
    messages: { sender: 'user' | 'bot', text: string }[] = [];
    lastProcessedtext: string = '';
    isMicActive = true;

    userData = localStorage.getItem('loggedInUser');

    langselect = localStorage.getItem('Selected_language');

    cif: any = null;

    constructor(
        private voiceservice: VoiceRecognitionService,
        private datePipe: DatePipe,
        private router: Router
    ) { }

    ngOnInit(): void {
        console.log("Voice Banking Loaded");
        setInterval(() => {
            this.isSpeaking = speechSynthesis.speaking;
        }, 500);

        if (this.userData) {
            const parsedData = JSON.parse(this.userData);
            this.cif = parsedData.CIFNO; // This gives you 43526326373
            console.log('Retrieved CIF:', this.cif);
        }

        if (!this.langselect) {
            const text = "Welcome to yono Voice banking, Please say your preferred language";
            this.speak(text, 'en-IN');
            console.log(text);
        }
        else {
            console.log(this.langselect);
            this.selectedLanguage = this.langselect;
        }
    }

    /* 🎤 Speech Result */
    onTranscriptChange(args: TranscriptChangedEventArgs): void {
        if (!args.isInterimResult) {

            let fulltext = args.transcript.toLowerCase().trim();

            let text = fulltext.replace(this.lastProcessedtext, '').trim();

            this.lastProcessedtext = fulltext;

            console.log("Transcript:", text);

            if (!text) return;

            if (!this.selectedLanguage) {
                this.detectLanguage(text);
                return;
            }

            this.messages = [];

            // ✅ Add user message
            this.messages.push({ sender: 'user', text });

            this.api_test(text, this.selectedLanguage);
        }
    }

    languageSelected = false;

    detectLanguage(text: string) {

        const languagePrompts: any = {
            'en-IN': "You selected English. How can I help you?",
            'hi-IN': "आपने हिंदी चुनी है। मैं आपकी क्या मदद कर सकता हूँ?",
            'te-IN': "మీరు తెలుగును ఎంచుకున్నారు. నేను మీకు ఎలా సహాయం చేయగలను?",
            'ta-IN': "நீங்கள் தமிழைத் தேர்ந்தெடுத்துள்ளீர்கள். நான் உங்களுக்கு எப்படி உதவுவது?",
            'mr-IN': "तुम्ही मराठी निवडली आहे. मी तुम्हाला कशी मदत करू शकतो?"
        };

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

        // ✅ Language selected
        this.languageSelected = true;

        this.speechToText.lang = this.selectedLanguage;

        const confirmText = languagePrompts[this.selectedLanguage];

        this.messages.push({ sender: 'bot', text: confirmText });
        this.speak(confirmText, this.selectedLanguage);

        console.log("Language set to:", this.selectedLanguage);

        localStorage.setItem('Selected_language', this.selectedLanguage);
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

    /* 🎤 Mic Events */
    onListeningStart(): void {
        this.listening = true;
        this.statusText = '🎙 Listening... Speak now...';
    }

    onListeningStop(): void {
        this.listening = false;
        this.statusText = 'Tap mic to speak';
    }

    onErrorHandler(args: any): void {
        console.error("Speech Error:", args?.errorMessage || args);
        this.statusText = args?.errorMessage || 'Speech error occurred';
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

    isSpeaking = false;

    speak(text: string, lang: string) {
        // console.log("Speaking")

        if (this.speechToText) {
            try {
                this.speechToText.stopListening();
            } catch (e) { }
        }

        this.isMicActive = false;

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        this.isSpeaking = true;

        const voices = speechSynthesis.getVoices();

        // speechSynthesis.getVoices().forEach(v => {
        //     console.log(v.lang, v.name);
        // });

        // 🎯 Try to find matching voice
        const selectedVoice = voices.find(v => v.lang === lang);

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else {
            console.warn("Voice not available for:", lang);
        }
        utterance.lang = lang;

        // 🎧 Make it softer
        utterance.rate = 0.8;   // slower = softer
        utterance.pitch = 1.2;  // slightly higher = pleasant
        utterance.volume = 1;

        utterance.onend = () => {
            this.isSpeaking = false
            setTimeout(() => {
                this.isMicActive = true;
            }, 300);
        };

        utterance.onerror = () => {
            this.isSpeaking = false;
            this.isMicActive = true;
        };

        speechSynthesis.speak(utterance);
    }

    onLogout() {
        const confirmLogout = confirm("Are you sure you want to logout?"); // Standard security check
        if (confirmLogout) {
            // 1. Clear transcripts and messages
            this.clearTranscript();
            this.messages = [];

            // 2. Clear session/auth tokens if applicable
            localStorage.clear();

            // 3. Navigate to login page
            console.log("User logged out");
            this.router.navigate(['/login']);
        }
    }



    /* 🚀 CORE MULTILINGUAL LOGIC */
    api_test(text: string, lang: string) {

        const lowerText = text.toLowerCase();

        const keywords: any = {
            balance: [
                'balance', 'bal', 'amount', 'rupees',
                'बैलेंस', 'पैसे', 'धन', // Hindi
                'బ్యాలెన్స్', 'డబ్బులు', 'నిల్వ','బాలన్స్', // Telugu
                'மீதி', 'பணம்', 'எவ்வளவு', // Tamil
                'शिल्लक', 'पैसे', 'किती', 'बॅलन्स' // Marathi
            ],
            statement: [
                'statement', 'history', 'transactions', 'transaction', 'last five', 'mini statement',
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
            ],
            debit_card: [
                'debit card', 'atm card', 'debit', 'card status', 'block card',
                'डेबिट कार्ड', 'एटीएम कार्ड', 'डेबिट', // Hindi
                'డెబిట్ కార్డ్', 'ఏటీఎం కార్డు', 'డెబిట్', // Telugu
                'டெபிட் கார்டு', 'ஏடிஎம் கார்டு', // Tamil
                'डेबिट कार्ड', 'एटीएम', 'डेबिट' // Marathi
            ],
            inb: [
                'internet banking', 'inb', 'online banking', 'net banking', 'web banking',
                'इंटरनेट बैंकिंग', 'नेट बैंकिंग', 'ऑनलाइन बैंकिंग', // Hindi
                'ఇంటర్నెట్ బ్యాంకింగ్', 'నెట్ బ్యాంకింగ్', 'ఆన్‌లైన్ బ్యాంకింగ్', // Telugu
                'இணைய வங்கி', 'நெட் பேங்கிங்', // Tamil
                'इंटरनेट बँकिंग', 'नेट बँकिंग' // Marathi
            ],
            aadhar: [
                'aadhar', 'uidai', 'link aadhar', 'aadhar card',
                'आधार', 'आधार कार्ड', 'आधार लिंक', // Hindi
                'ఆధార్', 'ఆధార్ కార్డ్', 'ఆధార్ లింక్', // Telugu
                'ஆதார்', 'ஆதார் கார்டு', 'இணைப்பு', // Tamil
                'आधार', 'आधार कार्ड', 'आधार लिंक' // Marathi
            ],
            kyc: [
                'kyc', 'know your customer', 'update kyc', 'verification', 'documents',
                'केवाईसी', 'के वाई सी', 'सत्यापन', 'दस्तावेज', // Hindi
                'కేవైసీ', 'ధృవీకరణ', 'పత్రాలు', // Telugu
                'கேஒய்சி', 'சரிபார்ப்பு', // Tamil
                'केवायसी', 'कागदपत्रे' // Marathi
            ],
            nominee: [
                'nominee', 'heir', 'nomination', 'beneficiary', 'add nominee',
                'नॉमिनी', 'नामांकन', 'वारिस', 'नामिती', // Hindi
                'నామినీ', 'నామినేషన్', 'లబ్ధిదారుడు', // Telugu
                'நாமினி', 'பயனாளரி', 'நியமனம்', // Tamil
                'नामांकन', 'लाभार्थी', 'नॉमिनी ' // Marathi
            ]
        };

        // 🔹 Intent Detection
        const isBalance = keywords.balance.some((k: string) => lowerText.includes(k));
        const isStatement = keywords.statement.some((k: string) => lowerText.includes(k));
        const isdebitcard = keywords.debit_card.some((k: string) => lowerText.includes(k));
        const isAadhar = keywords.aadhar.some((k: string) => lowerText.includes(k));
        const iskyc = keywords.kyc.some((k: string) => lowerText.includes(k));
        const isnominee = keywords.nominee.some((k: string) => lowerText.includes(k));
        const isinb = keywords.inb.some((k: string) => lowerText.includes(k));
        const iscreditcard = keywords.credit_card.some((k: string) => lowerText.includes(k));

        let responseText = '';
        let speakText = '';

        // helper functions
        const getSpacedDigits = (acno: any) => acno.toString().slice(-4).split('').join(' ');
        const formatDate = (date: any) => this.datePipe.transform(date, 'dd-MMM-yyyy');
        const getSpacedCard = (card: any) => card.toString().slice(-4).split('').join(' ');
        const getLastFour = (card: any) => card.toString().slice(-4);
        const dataparse = (res: any) => typeof res === 'string' ? JSON.parse(res) : res;


        // ✅ BALANCE API
        if (isBalance) {
            this.voiceservice.api_balance(this.cif).subscribe({
                next: (res: any) => {

                    const data = dataparse(res);
                    console.log(data);

                    if (this.selectedLanguage === 'hi-IN') {
                        responseText = speakText = 'आपके खाते की शेष राशि:';
                        data.forEach((val: any) => {
                            speakText += `आपके अंत में ${getSpacedDigits(val.acno)} वाले खाते में ${val.balance} रुपये शेष हैं। `;
                            responseText += `\n${val.acno}: ${val.balance}`;
                        });
                    }
                    else if (this.selectedLanguage === 'te-IN') {
                        responseText = speakText = 'మీ ఖాతా బ్యాలెన్స్:';
                        data.forEach((val: any) => {
                            speakText += `${getSpacedDigits(val.acno)} తో ముగిసే మీ ఖాతాలో ${val.balance} రూపాయల నిల్వ ఉంది. `;
                            responseText += `\n${val.acno}: ${val.balance}`;
                        });
                    }
                    else if (this.selectedLanguage === 'ta-IN') {
                        responseText = speakText = 'உங்கள் கணக்கு இருப்பு:';
                        data.forEach((val: any) => {
                            speakText += `${getSpacedDigits(val.acno)} என்று முடியும் உங்கள் கணக்கில் ${val.balance} ரூபாய் உள்ளது. `;
                            responseText += `\n${val.acno}: ${val.balance}`;
                        });
                    }
                    else if (this.selectedLanguage === 'mr-IN') {
                        responseText = speakText = 'तुमच्या खात्यातील शिल्लक:';
                        data.forEach((val: any) => {
                            speakText += `तुमच्या शेवटी ${getSpacedDigits(val.acno)} असलेल्या खात्यात ${val.balance} रुपये शिल्लक आहेत. `;
                            responseText += `\n${val.acno}: ${val.balance}`;
                        });
                    }
                    else {
                        responseText = 'Your account balance is:';
                        data.forEach((val: any) => {
                            speakText += `Your account ending with ${getSpacedDigits(val.acno)} has a balance of ${val.balance} Rupees. `;
                            responseText += `\n${val.acno}: ${val.balance}`;
                        });
                    }

                    this.messages.push({ sender: 'bot', text: responseText });
                    this.onListeningStop();
                    this.speak(speakText, this.selectedLanguage);
                    responseText = ''
                    speakText = ''

                },
                error: (err) => console.error(err)
            });

        }

        // ✅ STATEMENT API
        else if (isStatement) {

            this.voiceservice.api_getlastfivetransactions(this.cif).subscribe({
                next: (res: any) => {

                    const data = dataparse(res);

                    if (this.selectedLanguage === 'hi-IN') {
                        responseText = "आपके हालिया लेनदेन यहाँ हैं: \n";
                        data.forEach((txn: any) => {
                            const isCredit = txn.amount > 0;
                            const type = isCredit ? "जमा किए गए" : "निकाले गए";
                            const account = isCredit ? txn.from_acc : txn.to_acc;
                            const particle = isCredit ? "से" : "को"; // "from" vs "to"

                            responseText += `तारीख: ${formatDate(txn.date)}, ${Math.abs(txn.amount)} रुपये ${account} खाते ${particle} ${type}। \n`;
                        });
                    }
                    else if (this.selectedLanguage === 'te-IN') {
                        responseText = "మీ ఇటీవలి లావాదేవీలు ఇక్కడ ఉన్నాయి: \n";
                        data.forEach((txn: any) => {
                            const isCredit = txn.amount > 0;
                            const type = isCredit ? "జమ చేయబడింది" : "డెబిట్ చేయబడింది";
                            const account = isCredit ? txn.from_acc : txn.to_acc;
                            const particle = isCredit ? "నుండి" : "కు";

                            responseText += `తేదీ: ${formatDate(txn.date)}, ${Math.abs(txn.amount)} రూపాయలు ${account} ఖాతా ${particle} ${type}। \n`;
                        });
                    }
                    else if (this.selectedLanguage === 'ta-IN') {
                        responseText = "உங்கள் சமீபத்திய பரிவர்த்தனைகள் இங்கே: \n";
                        data.forEach((txn: any) => {
                            const isCredit = txn.amount > 0;
                            const type = isCredit ? "வரவு வைக்கப்பட்டது" : "பற்று வைக்கப்பட்டது";
                            const account = isCredit ? txn.from_acc : txn.to_acc;
                            const particle = isCredit ? "இருந்து" : "க்கு";

                            responseText += `தேதி: ${formatDate(txn.date)}, ${Math.abs(txn.amount)} ரூபாய் ${account} கணக்கிற்கு ${particle} ${type}। \n`;
                        });
                    }
                    else if (this.selectedLanguage === 'mr-IN') {
                        responseText = "तुमचे अलीकडील व्यवहार येथे आहेत: \n";
                        data.forEach((txn: any) => {
                            const isCredit = txn.amount > 0;
                            const type = isCredit ? "जमा झाले" : "खर्च झाले";
                            const account = isCredit ? txn.from_acc : txn.to_acc;
                            const particle = isCredit ? "कडून" : "कडे";

                            responseText += `तारीख: ${formatDate(txn.date)}, ${Math.abs(txn.amount)} रुपये ${account} खात्या ${particle} ${type}। \n`;
                        });
                    }
                    else {
                        if (data.length == 0) {
                            responseText = "There are no transactions";
                        }
                        else {
                            responseText = "Here are your recent transactions: \n";
                            data.forEach((txn: any) => {
                                const isCredit = txn.amount > 0;
                                const action = isCredit ? "credited from" : "debited to";
                                const account = isCredit ? txn.from_acc : txn.to_acc;

                                responseText += `Date: ${formatDate(txn.date)}, amount ${Math.abs(txn.amount)} rupees ${action} ${account} account. \n`;
                            });
                        }
                    }

                    this.messages.push({ sender: 'bot', text: responseText });
                    this.speak(responseText, lang);
                    responseText = ''
                    speakText = ''
                },
                error: (err) => console.error(err)
            });

        }

        else if (isnominee) {
            this.voiceservice.api_nominee(this.cif).subscribe({
                next: (res: any) => {

                    const data = dataparse(res);

                    const nomineeCalls: any[] = [];

                    // 🔹 First loop → prepare base text + collect API calls
                    data.forEach((txn: any) => {

                        if (txn.nomineeFacility === 'Y') {

                            nomineeCalls.push(this.voiceservice.api_nomineeDetails(this.cif));

                            if (this.selectedLanguage === 'hi-IN') {
                                responseText += `आपके खाता संख्या ${txn.acno} में नामांकित व्यक्ति (नॉमिनी) का विवरण है।\n\n`;
                                speakText += `आपके अंत में ${getSpacedCard(txn.acno)} वाले खाते में नॉमिनी का विवरण उपलब्ध है। `;
                            }
                            else if (this.selectedLanguage === 'te-IN') {
                                responseText += `మీ ఖాతా సంఖ్య ${txn.acno} లో నామినీ వివరాలు ఉన్నాయి.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} తో ముగిసే మీ ఖాతాలో నామినీ వివరాలు ఉన్నాయి. `;
                            }
                            else if (this.selectedLanguage === 'ta-IN') {
                                responseText += `உங்கள் கணக்கு எண் ${txn.acno} வாரிசுதாரர் (நாமிணி) விவரங்களைக் கொண்டுள்ளது.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} என முடியும் உங்கள் கணக்கில் நாமிணி விவரங்கள் உள்ளன. `;
                            }
                            else if (this.selectedLanguage === 'mr-IN') {
                                responseText += `तुमच्या खाते क्रमांक ${txn.acno} मध्ये वारसदार (नॉमिनी) तपशील आहेत.\n\n`;
                                speakText += `तुमच्या शेवटी ${getSpacedCard(txn.acno)} असलेल्या खात्यात नॉमिनी तपशील उपलब्ध आहेत. `;
                            }
                            else {
                                responseText += `Your account number ${txn.acno} has nominee details.\n\n`;
                                speakText += `Your account ending with ${getSpacedCard(txn.acno)} has nominee details. `;
                            }

                        } else {

                            // ❌ No nominee
                            if (this.selectedLanguage === 'hi-IN') {
                                responseText += `आपके खाता संख्या ${txn.acno} में नॉमिनी का विवरण नहीं है।\n\n`;
                                speakText += `आपके अंत में ${getSpacedCard(txn.acno)} वाले खाते में नॉमिनी का विवरण नहीं है। `;
                            }
                            else if (this.selectedLanguage === 'te-IN') {
                                responseText += `మీ ఖాతా సంఖ్య ${txn.acno} లో నామినీ వివరాలు లేవు.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} తో ముగిసే మీ ఖాతాలో నామినీ వివరాలు లేవు. `;
                            }
                            else if (this.selectedLanguage === 'ta-IN') {
                                responseText += `உங்கள் கணக்கு எண் ${txn.acno} இல் நாமிணி விவரங்கள் இல்லை.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} என முடியும் உங்கள் கணக்கில் நாமிணி விவரங்கள் இல்லை. `;
                            }
                            else if (this.selectedLanguage === 'mr-IN') {
                                responseText += `तुमच्या खाते क्रमांक ${txn.acno} मध्ये नॉमिनी तपशील नाहीत.\n\n`;
                                speakText += `तुमच्या शेवटी ${getSpacedCard(txn.acno)} असलेल्या खात्यात नॉमिनी तपशील नाहीत. `;
                            }
                            else {
                                responseText += `Your account ${txn.acno} does not have nominee details.\n\n`;
                                speakText += `Your account ending with ${getSpacedCard(txn.acno)} does not have nominee details. `;
                            }
                        }
                    });

                    // ✅ If no nominee API calls → directly show
                    if (nomineeCalls.length === 0) {
                        this.messages.push({ sender: 'bot', text: responseText });
                        this.speak(speakText, this.selectedLanguage);
                        responseText = '';
                        speakText = '';
                        return;
                    }

                    // 🔥 Execute all nominee detail APIs
                    forkJoin(nomineeCalls).subscribe({
                        next: (results: any[]) => {

                            results.forEach((resl: any) => {

                                const subdata = typeof resl === 'string' ? JSON.parse(resl) : resl;

                                subdata.forEach((new_txn: any) => {

                                    if (this.selectedLanguage === 'hi-IN') {
                                        responseText += `नाम: ${new_txn.nomineename}, संबंध: ${new_txn.nomineerelation}, हिस्सा: ${new_txn.nomineeshare}%\n\n`;
                                        speakText += `नॉमिनी का नाम ${new_txn.nomineename} है, वे आपके ${new_txn.nomineerelation} हैं और उनका हिस्सा ${new_txn.nomineeshare} प्रतिशत है। `;
                                    }
                                    else if (this.selectedLanguage === 'te-IN') {
                                        responseText += `నామినీ పేరు: ${new_txn.nomineename}, సంబంధం: ${new_txn.nomineerelation}, వాటా: ${new_txn.nomineeshare}%\n\n`;
                                        speakText += `నామినీ పేరు ${new_txn.nomineename}, వారు మీకు ${new_txn.nomineerelation} అవుతారు మరియు వారి వాటా ${new_txn.nomineeshare} శాతం. `;
                                    }
                                    else if (this.selectedLanguage === 'ta-IN') {
                                        responseText += `பெயர்: ${new_txn.nomineename}, உறவு: ${new_txn.nomineerelation}, பங்கு: ${new_txn.nomineeshare}%\n\n`;
                                        speakText += `நாமிணியின் பெயர் ${new_txn.nomineename}, உறவு ${new_txn.nomineerelation} மற்றும் அவர்களின் பங்கு ${new_txn.nomineeshare} சதவீதம். `;
                                    }
                                    else if (this.selectedLanguage === 'mr-IN') {
                                        responseText += `नाव: ${new_txn.nomineename}, नाते: ${new_txn.nomineerelation}, हिस्सा: ${new_txn.nomineeshare}%\n\n`;
                                        speakText += `नॉमिनीचे नाव ${new_txn.nomineename} आहे, ते तुमचे ${new_txn.nomineerelation} आहेत आणि त्यांचा हिस्सा ${new_txn.nomineeshare} टक्के आहे. `;
                                    }
                                    else {
                                        responseText += `Nominee: ${new_txn.nomineename}, Relation: ${new_txn.nomineerelation}, Share: ${new_txn.nomineeshare}%\n\n`;
                                        speakText += `Nominee name is ${new_txn.nomineename}, relation is ${new_txn.nomineerelation} and their share is ${new_txn.nomineeshare} percent. `;
                                    }

                                });
                            });

                            // ✅ FINAL UPDATE AFTER ALL CALLS
                            this.messages.push({ sender: 'bot', text: responseText });
                            this.speak(speakText, this.selectedLanguage);

                            responseText = '';
                            speakText = '';
                        },
                        error: (err) => console.error(err)
                    });

                },
                error: (err) => console.error(err)
            });
        }

        else if (iscreditcard) {
            this.voiceservice.api_credit(this.cif).subscribe({
                next: (res: any) => {
                    const data = dataparse(res);

                    if (this.selectedLanguage === 'hi-IN') {
                        responseText = "आपके क्रेडिट कार्ड का विवरण यहाँ है: \n";
                        data.forEach((txn: any) => {
                            responseText += `क्रेडिट कार्ड (अंत में ${getLastFour(txn.cardnumber)}): 
                            • कुल सीमा: ₹${txn.card_limit} 
                            • बकाया राशि: ₹${txn.outstanding_limit}
                            • देय तिथि: ${formatDate(txn.duedate)}\n\n`;

                            speakText += `आपके अंत में ${getSpacedCard(txn.cardnumber)} वाले क्रेडिट कार्ड की कुल सीमा ${txn.card_limit} रुपये है, बकाया राशि ${txn.outstanding_limit} रुपये है और देय तिथि ${formatDate(txn.duedate)} है। `;
                        });
                    }
                    else if (this.selectedLanguage === 'te-IN') {
                        responseText = "మీ క్రెడిట్ కార్డ్ వివరాలు ఇక్కడ ఉన్నాయి: \n";
                        data.forEach((txn: any) => {
                            responseText += `క్రెడిట్ కార్డ్ (చివరన ${getLastFour(txn.cardnumber)}): 
                            • మొత్తం పరిమితి: ₹${txn.card_limit} 
                            • బాకీ ఉన్న మొత్తం: ₹${txn.outstanding_limit}
                            • గడువు తేదీ: ${formatDate(txn.duedate)}\n\n`;

                            speakText += `${getSpacedCard(txn.cardnumber)} తో ముగిసే మీ క్రెడిట్ కార్డ్ మొత్తం పరిమితి ${txn.card_limit} రూపాయలు, బాకీ ఉన్న మొత్తం ${txn.outstanding_limit} రూపాయలు మరియు చెల్లింపు గడువు తేదీ ${formatDate(txn.duedate)}. `;
                        });
                    }
                    else if (this.selectedLanguage === 'ta-IN') {
                        responseText = "உங்கள் கிரெடிட் கார்டு விவரங்கள் இங்கே: \n";
                        data.forEach((txn: any) => {
                            responseText += `கிரெடிட் கார்டு (${getLastFour(txn.cardnumber)} இல் முடிகிறது): 
                            • மொத்த வரம்பு: ₹${txn.card_limit} 
                            • நிலுவையில் உள்ள தொகை: ₹${txn.outstanding_limit}
                            • கடைசி தேதி: ${formatDate(txn.duedate)}\n\n`;

                            speakText += `${getSpacedCard(txn.cardnumber)} என்று முடியும் உங்கள் கிரெடிட் கார்டு வரம்பு ${txn.card_limit} ரூபாய், நிலுவையில் உள்ள தொகை ${txn.outstanding_limit} ரூபாய் மற்றும் கடைசி தேதி ${formatDate(txn.duedate)}. `;
                        });
                    }
                    else if (this.selectedLanguage === 'mr-IN') {
                        responseText = "तुमच्या क्रेडिट कार्डचा तपशील येथे आहे: \n";
                        data.forEach((txn: any) => {
                            responseText += `क्रेडिट कार्ड (शेवटी ${getLastFour(txn.cardnumber)}): 
                            • एकूण मर्यादा: ₹${txn.card_limit} 
                            • थकबाकी: ₹${txn.outstanding_limit}
                            • देय तारीख: ${formatDate(txn.duedate)}\n\n`;

                            speakText += `तुमच्या शेवटी ${getSpacedCard(txn.cardnumber)} असलेल्या क्रेडिट कार्डची एकूण मर्यादा ${txn.card_limit} रुपये आहे, थकबाकी ${txn.outstanding_limit} रुपये आहे आणि देय तारीख ${formatDate(txn.duedate)} आहे। `;
                        });
                    }
                    else {
                        responseText = "Here are your credit card details: \n";
                        data.forEach((txn: any) => {
                            const spacedCard = getSpacedCard(txn.cardnumber);
                            responseText += `Credit Card ending in ${getLastFour(txn.cardnumber)}:  
                            • Total Limit: ₹${txn.card_limit} 
                            • Outstanding: ₹${txn.outstanding_limit}
                            • Due Date: ${formatDate(txn.duedate)}\n\n`;
                            speakText += `Your credit card ending with ${spacedCard} has total limit of ${txn.card_limit} rupees and outstanding balance of ${txn.outstanding_limit} rupees and the due date is ${formatDate(txn.duedate)}. `;
                        });
                    }

                    this.messages.push({ sender: 'bot', text: responseText });
                    this.speak(speakText, this.selectedLanguage);
                    responseText = ''
                    speakText = ''
                },
                error: (err) => console.error(err)
            });
        }

        else if (isdebitcard) {
            this.voiceservice.api_debit(this.cif).subscribe({
                next: (res: any) => {
                    const data = dataparse(res);

                    const debitCardCalls: any[] = [];
                    const debitAccounts: any[] = [];

                    // First loop → prepare base text + collect API calls
                    data.forEach((txn: any) => {

                        if (txn.debitCard === 'Y') {
                            debitAccounts.push(txn);
                            debitCardCalls.push(this.voiceservice.api_debitcard(this.cif));

                            // Language-specific base messages
                            if (this.selectedLanguage === 'hi-IN') {
                                responseText += `आपके खाता संख्या ${txn.acno} में डेबिट कार्ड सक्रिय है।\n\n`;
                                speakText += `आपके अंत में ${getSpacedCard(txn.acno)} वाले खाते में डेबिट कार्ड सक्रिय है। `;
                            }
                            else if (this.selectedLanguage === 'te-IN') {
                                responseText += `మీ ఖాతా సంఖ్య ${txn.acno} కు యాక్టివ్ డెబిట్ కార్డ్ ఉంది.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} తో ముగిసే మీ ఖాతాకు డెబిట్ కార్డ్ ఉంది. `;
                            }
                            else if (this.selectedLanguage === 'ta-IN') {
                                responseText += `உங்கள் கணக்கு எண் ${txn.acno} செயலில் உள்ள டெபிட் கார்டைக் கொண்டுள்ளது.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} என முடியும் உங்கள் கணக்கில் டெபிட் கார்டு செயல்பாட்டில் உள்ளது. `;
                            }
                            else if (this.selectedLanguage === 'mr-IN') {
                                responseText += `तुमच्या खाते क्रमांक ${txn.acno} मध्ये सक्रिय डेबिट कार्ड आहे.\n\n`;
                                speakText += `तुमच्या शेवटी ${getSpacedCard(txn.acno)} असलेल्या खात्यात सक्रिय डेबिट कार्ड आहे. `;
                            }
                            else {
                                responseText += `Your account number ${txn.acno} has an active debit card.\n\n`;
                                speakText += `Your account number ending with ${getSpacedCard(txn.acno)} has an active debit card. `;
                            }

                        } else {
                            // No debit card case
                            if (this.selectedLanguage === 'hi-IN') {
                                responseText += `आपके खाते ${txn.acno} में डेबिट कार्ड की सुविधा उपलब्ध नहीं है।\n\n`;
                                speakText += `आपके अंत में ${getSpacedCard(txn.acno)} वाले खाते में डेबिट कार्ड की सुविधा उपलब्ध नहीं है। `;
                            }
                            else if (this.selectedLanguage === 'te-IN') {
                                responseText += `మీ ఖాతా ${txn.acno} కు డెబిట్ కార్డ్ సౌకర్యం లేదు.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} తో ముగిసే మీ ఖాతాకు డెబిట్ కార్డ్ సౌకర్యం లేదు. `;
                            }
                            else if (this.selectedLanguage === 'ta-IN') {
                                responseText += `உங்கள் கணக்கு ${txn.acno} டெபிட் கார்டு வசதியைப் பெறவில்லை.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} என முடியும் உங்கள் கணக்கில் டெபிட் கார்டு வசதி இல்லை. `;
                            }
                            else if (this.selectedLanguage === 'mr-IN') {
                                responseText += `तुमच्या खात्यात ${txn.acno} डेबिट कार्ड सुविधा उपलब्ध नाही.\n\n`;
                                speakText += `तुमच्या शेवटी ${getSpacedCard(txn.acno)} असलेल्या खात्यात डेबिट कार्ड सुविधा उपलब्ध नाही. `;
                            }
                            else {
                                responseText += `Your account ${txn.acno} has not availed debit card facility.\n\n`;
                                speakText += `Your account ending with ${getSpacedCard(txn.acno)} has not availed debit card facility. `;
                            }
                        }
                    });

                    // ✅ If no debit card API calls → directly update UI
                    if (debitCardCalls.length === 0) {
                        this.messages.push({ sender: 'bot', text: responseText });
                        this.speak(speakText, this.selectedLanguage);
                        responseText = '';
                        speakText = '';
                        return;
                    }

                    // ✅ Execute all API calls together
                    forkJoin(debitCardCalls).subscribe({
                        next: (results: any[]) => {

                            results.forEach((resl: any) => {
                                const subdata = typeof resl === 'string' ? JSON.parse(resl) : resl;

                                subdata.forEach((new_txn: any) => {

                                    if (this.selectedLanguage === 'hi-IN') {
                                        responseText += `आपका डेबिट कार्ड ${new_txn.cardnumber}, ${formatDate(new_txn.validtill)} तक मान्य है।\n\n`;
                                        speakText += `आपका डेबिट कार्ड जिसके अंत में ${getSpacedCard(new_txn.cardnumber)} है, वह ${formatDate(new_txn.validtill)} तक मान्य है। `;
                                    }
                                    else if (this.selectedLanguage === 'te-IN') {
                                        responseText += `మీ డెబిట్ కార్డ్ ${new_txn.cardnumber}, ${formatDate(new_txn.validtill)} వరకు చెల్లుబాటు అవుతుంది.\n\n`;
                                        speakText += `${getSpacedCard(new_txn.cardnumber)} తో ముగిసే మీ డెబిట్ కార్డ్ ${formatDate(new_txn.validtill)} వరకు చెల్లుబాటు అవుతుంది. `;
                                    }
                                    else if (this.selectedLanguage === 'ta-IN') {
                                        responseText += `உங்கள் டெபிட் கார்டு ${new_txn.cardnumber}, ${formatDate(new_txn.validtill)} வரை செல்லும்.\n\n`;
                                        speakText += `${getSpacedCard(new_txn.cardnumber)} என முடியும் உங்கள் டெபிட் கார்டு ${formatDate(new_txn.validtill)} வரை செல்லும். `;
                                    }
                                    else if (this.selectedLanguage === 'mr-IN') {
                                        responseText += `तुमचे डेबिट कार्ड ${new_txn.cardnumber}, ${formatDate(new_txn.validtill)} पर्यंत वैध आहे.\n\n`;
                                        speakText += `तुमचे डेबिट कार्ड ज्याच्या शेवटी ${getSpacedCard(new_txn.cardnumber)} आहे, ते ${formatDate(new_txn.validtill)} पर्यंत वैध आहे. `;
                                    }
                                    else {
                                        responseText += `Your debit card ${new_txn.cardnumber} is valid till ${formatDate(new_txn.validtill)}\n\n`;
                                        speakText += `Your debit card ending with ${getSpacedCard(new_txn.cardnumber)} is valid till ${formatDate(new_txn.validtill)}. `;
                                    }

                                });
                            });

                            // ✅ FINAL UI UPDATE (after all APIs)
                            this.messages.push({ sender: 'bot', text: responseText });
                            this.speak(speakText, this.selectedLanguage);

                            responseText = '';
                            speakText = '';
                        },
                        error: (err) => console.error(err)
                    });
                },
                error: (err) => console.error(err)
            });
        }

        else if (isAadhar) {
            this.voiceservice.api_aadhar(this.cif).subscribe({
                next: (res: any) => {
                    const data = dataparse(res);
                    if (this.selectedLanguage === 'hi-IN') {
                        data.forEach((txn: any) => {
                            if (txn.aadharLinkage === 'Y') {
                                responseText += `आपका खाता संख्या ${txn.acno} आधार से लिंक है।\n\n`;
                                speakText += `आपके अंत में ${getSpacedCard(txn.acno)} वाले खाते में आधार लिंक है। `;
                            }
                            else {
                                responseText += `आपका खाता संख्या ${txn.acno} आधार से लिंक नहीं है।\n\n`;
                                speakText += `आपके अंत में ${getSpacedCard(txn.acno)} वाले खाते में आधार लिंक नहीं है। `;
                            }
                        });
                    }
                    else if (this.selectedLanguage === 'te-IN') {
                        data.forEach((txn: any) => {
                            if (txn.aadharLinkage === 'Y') {
                                responseText += `మీ ఖాతా సంఖ్య ${txn.acno} ఆధార్‌తో అనుసంధానించబడింది.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} తో ముగిసే మీ ఖాతా ఆధార్‌తో అనుసంధానించబడింది. `;
                            }
                            else {
                                responseText += `మీ ఖాతా సంఖ్య ${txn.acno} ఆధార్‌తో అనుసంధానించబడలేదు.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} తో ముగిసే మీ ఖాతా ఆధార్‌తో అనుసంధానించబడలేదు. `;
                            }
                        });
                    }
                    else if (this.selectedLanguage === 'ta-IN') {
                        data.forEach((txn: any) => {
                            if (txn.aadharLinkage === 'Y') {
                                responseText += `உங்கள் கணக்கு எண் ${txn.acno} ஆதாருடன் இணைக்கப்பட்டுள்ளது.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} என முடியும் உங்கள் கணக்கு ஆதாருடன் இணைக்கப்பட்டுள்ளது. `;
                            }
                            else {
                                responseText += `உங்கள் கணக்கு எண் ${txn.acno} ஆதாருடன் இணைக்கப்படவில்லை.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} என முடியும் உங்கள் கணக்கு ஆதாருடன் இணைக்கப்படவில்லை. `;
                            }
                        });
                    }
                    else if (this.selectedLanguage === 'mr-IN') {
                        data.forEach((txn: any) => {
                            if (txn.aadharLinkage === 'Y') {
                                responseText += `तुमचा खाते क्रमांक ${txn.acno} आधारशी लिंक आहे.\n\n`;
                                speakText += `तुमच्या शेवटी ${getSpacedCard(txn.acno)} असलेल्या खात्यात आधार लिंक आहे। `;
                            }
                            else {
                                responseText += `तुमचा खाते क्रमांक ${txn.acno} आधारशी लिंक नाही.\n\n`;
                                speakText += `तुमच्या शेवटी ${getSpacedCard(txn.acno)} असलेल्या खात्यात आधार लिंक नाही। `;
                            }
                        });
                    }
                    else {
                        // Default English
                        data.forEach((txn: any) => {
                            if (txn.aadharLinkage === 'Y') {
                                responseText += `Your account number ${txn.acno} is linked with Aadhar.\n\n`;
                                speakText += `Your account number ending with ${getSpacedCard(txn.acno)} is linked with Aadhar. `;
                            }
                            else {
                                responseText += `Your account ${txn.acno} is not linked with Aadhar.\n\n`;
                                speakText += `Your account number ending with ${getSpacedCard(txn.acno)} is not linked with Aadhar. `;
                            }
                        });
                    }

                    this.messages.push({ sender: 'bot', text: responseText });
                    this.speak(speakText, this.selectedLanguage);
                    responseText = ''
                    speakText = ''
                },
                error: (err) => console.error(err)
            })
        }

        else if (isinb) {
            this.voiceservice.api_inb(this.cif).subscribe({
                next: (res: any) => {
                    const data = dataparse(res);

                    if (this.selectedLanguage === 'hi-IN') {
                        data.forEach((txn: any) => {
                            if (txn.inbFacility === 'Y') {
                                responseText += `आपके खाता संख्या ${txn.acno} में इंटरनेट बैंकिंग की सुविधा उपलब्ध है।\n\n`;
                                speakText += `आपके अंत में ${getSpacedCard(txn.acno)} वाले खाते में इंटरनेट बैंकिंग की सुविधा उपलब्ध है। `;
                            }
                            else {
                                responseText += `आपके खाता संख्या ${txn.acno} में इंटरनेट बैंकिंग की सुविधा उपलब्ध नहीं है।\n\n`;
                                speakText += `आपके अंत में ${getSpacedCard(txn.acno)} वाले खाते में इंटरनेट बैंकिंग की सुविधा उपलब्ध नहीं है। `;
                            }
                        });
                    }
                    else if (this.selectedLanguage === 'te-IN') {
                        data.forEach((txn: any) => {
                            if (txn.inbFacility === 'Y') {
                                responseText += `మీ ఖాతా సంఖ్య ${txn.acno} కు ఇంటర్నెట్ బ్యాంకింగ్ సదుపాయం ఉంది.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} తో ముగిసే మీ ఖాతాకు ఇంటర్నెట్ బ్యాంకింగ్ సదుపాయం ఉంది. `;
                            }
                            else {
                                responseText += `మీ ఖాతా సంఖ్య ${txn.acno} కు ఇంటర్నెట్ బ్యాంకింగ్ సదుపాయం లేదు.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} తో ముగిసే మీ ఖాతాకు ఇంటర్నెట్ బ్యాంకింగ్ సదుపాయం లేదు. `;
                            }
                        });
                    }
                    else if (this.selectedLanguage === 'ta-IN') {
                        data.forEach((txn: any) => {
                            if (txn.inbFacility === 'Y') {
                                responseText += `உங்கள் கணக்கு எண் ${txn.acno} இணைய வங்கி வசதியைப் பெற்றுள்ளது.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} என முடியும் உங்கள் கணக்கில் இணைய வங்கி வசதி உள்ளது. `;
                            }
                            else {
                                responseText += `உங்கள் கணக்கு எண் ${txn.acno} இணைய வங்கி வசதியைப் பெறவில்லை.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} என முடியும் உங்கள் கணக்கில் இணைய வங்கி வசதி இல்லை. `;
                            }
                        });
                    }
                    else if (this.selectedLanguage === 'mr-IN') {
                        data.forEach((txn: any) => {
                            if (txn.inbFacility === 'Y') {
                                responseText += `तुमच्या खाते क्रमांक ${txn.acno} मध्ये इंटरनेट बँकिंग सुविधा उपलब्ध आहे.\n\n`;
                                speakText += `तुमच्या शेवटी ${getSpacedCard(txn.acno)} असलेल्या खात्यात इंटरनेट बँकिंग सुविधा उपलब्ध आहे। `;
                            }
                            else {
                                responseText += `तुमच्या खाते क्रमांक ${txn.acno} मध्ये इंटरनेट बँकिंग सुविधा उपलब्ध नाही.\n\n`;
                                speakText += `तुमच्या शेवटी ${getSpacedCard(txn.acno)} असलेल्या खात्यात इंटरनेट बँकिंग सुविधा उपलब्ध नाही। `;
                            }
                        });
                    }
                    else {
                        // Default English
                        data.forEach((txn: any) => {
                            if (txn.inbFacility === 'Y') {
                                responseText += `Your account number ${txn.acno} has availed internet banking facility.\n\n`;
                                speakText += `Your account number ending with ${getSpacedCard(txn.acno)} has availed internet banking facility. `;
                            }
                            else {
                                responseText += `Your account ${txn.acno} has not availed internet banking facility.\n\n`;
                                speakText += `Your account number ending with ${getSpacedCard(txn.acno)} has not availed internet banking facility. `;
                            }
                        });
                    }

                    this.messages.push({ sender: 'bot', text: responseText });
                    this.speak(speakText, this.selectedLanguage);
                    responseText = ''
                    speakText = ''
                },
                error: (err) => console.error(err)
            })
        }

        else if (iskyc) {
            this.voiceservice.api_kyc(this.cif).subscribe({
                next: (res: any) => {
                    const data = dataparse(res);
                    if (this.selectedLanguage === 'hi-IN') {
                        data.forEach((txn: any) => {
                            if (txn.kycEnquiry === 'Y') {
                                responseText += `आपके खाता संख्या ${txn.acno} का KYC पूरा हो गया है।\n\n`;
                                speakText += `आपके अंत में ${getSpacedCard(txn.acno)} वाले खाते का के वाई सी पूरा हो गया है।`;
                            }
                            else {
                                responseText += `आपके खाते ${txn.acno} का KYC पूरा नहीं हुआ है।\n\n`;
                                speakText += `आपके अंत में ${getSpacedCard(txn.acno)} वाले खाते का के वाई सी पूरा नहीं हुआ है।`;
                            }
                        });
                    }
                    else if (this.selectedLanguage === 'te-IN') {
                        data.forEach((txn: any) => {
                            if (txn.kycEnquiry === 'Y') {
                                responseText += `మీ ఖాతా సంఖ్య ${txn.acno} KYC పూర్తయింది.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} తో ముగిసే మీ ఖాతా కే వై సీ పూర్తయింది.`;
                            }
                            else {
                                responseText += `మీ ఖాతా ${txn.acno} KYC పూర్తి కాలేదు.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} తో ముగిసే మీ ఖాతా కే వై సీ పూర్తి కాలేదు.`;
                            }
                        });
                    }
                    else if (this.selectedLanguage === 'ta-IN') {
                        data.forEach((txn: any) => {
                            if (txn.kycEnquiry === 'Y') {
                                responseText += `உங்கள் கணக்கு எண் ${txn.acno} KYC முடிந்தது.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} என முடியும் உங்கள் கணக்கின் கே ஒய் சி முடிந்தது.`;
                            }
                            else {
                                responseText += `உங்கள் கணக்கு ${txn.acno} KYC இன்னும் முடிவடையவில்லை.\n\n`;
                                speakText += `${getSpacedCard(txn.acno)} என முடியும் உங்கள் கணக்கின் கே ஒய் சி இன்னும் முடிவடையவில்லை.`;
                            }
                        });
                    }
                    else if (this.selectedLanguage === 'mr-IN') {
                        data.forEach((txn: any) => {
                            if (txn.kycEnquiry === 'Y') {
                                responseText += `तुमच्या खाते क्रमांक ${txn.acno} चे KYC पूर्ण झाले आहे.`;
                                speakText += `तुमच्या शेवटी ${getSpacedCard(txn.acno)} असलेल्या खात्याचे के वाई सी पूर्ण झाले आहे.`;
                            }
                            else {
                                responseText += `तुमच्या खात्याचे ${txn.acno} KYC पूर्ण झालेले नाही.`
                                speakText += `तुमच्या शेवटी ${getSpacedCard(txn.acno)} असलेल्या खात्याचे के वाई सी पूर्ण झालेले नाही.`
                            }
                        });
                    }
                    else {
                        data.forEach((txn: any) => {
                            if (txn.kycEnquiry === 'Y') {
                                responseText += `Your account number ${txn.acno} has completed KYC.`;
                                speakText += `Your account number ending with ${getSpacedCard(txn.acno)} has completed KYC.`;
                            }
                            else {
                                responseText += `Your account ${txn.acno} has not completed KYC.`;
                                speakText += `Your account number ending with ${getSpacedCard(txn.acno)} has not completed KYC.`;
                            }
                        });
                    }

                    this.messages.push({ sender: 'bot', text: responseText });
                    this.speak(speakText, this.selectedLanguage);
                    responseText = ''
                    speakText = ''
                },
                error: (err) => console.error(err)
            })
        }

        // ❌ FALLBACK
        else {

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
                responseText = "Sorry, I didn’t understand. I can only answer about banking services like balance, statement, or credit card.";
            }

            this.messages.push({ sender: 'bot', text: responseText });
            this.speak(responseText, this.selectedLanguage);
            responseText = ''
            speakText = ''
        }
    }
}