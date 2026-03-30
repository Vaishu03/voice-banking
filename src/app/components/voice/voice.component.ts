import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
// import { SBDescriptionComponent } from '../common/dp.component';
// import { SBActionDescriptionComponent } from '../common/adp.component';
import { SpeechToTextModule, TextAreaModule, SpeechToTextComponent, TextAreaComponent, ErrorEventArgs, StopListeningEventArgs, TranscriptChangedEventArgs } from '@syncfusion/ej2-angular-inputs';
import { DropDownListModule, ChangeEventArgs as DDLChangeEventArgs, DropDownListComponent } from '@syncfusion/ej2-angular-dropdowns';
import { SwitchModule, ButtonModule, ChangeEventArgs, SwitchComponent, ButtonComponent } from '@syncfusion/ej2-angular-buttons';
@Component({
    selector: 'app-voice',
    templateUrl: 'voice.component.html',
    styleUrls: ['voice.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [SpeechToTextModule, TextAreaModule, SwitchModule, ButtonModule, DropDownListModule]
})
export class VoiceComponent {

    @ViewChild('speechToText') speechToText!: SpeechToTextComponent;
    @ViewChild('outputTextarea') outputTextarea!: TextAreaComponent;
    @ViewChild('sttStylingDdl') sttStylingDdl!: DropDownListComponent;
    @ViewChild('sttLangDdl') sttLangDdl!: DropDownListComponent;
    @ViewChild('interimSwitch') interimSwitch!: SwitchComponent;
    @ViewChild('tooltipSwitch') tooltipSwitch!: SwitchComponent;
    @ViewChild('iconWithTextSwitch') iconWithTextSwitch!: SwitchComponent;

    private isSupportedBrowser: boolean = true;
    public colorsData: Object[] = [
        { text: 'Normal', value: '' },
        { text: 'Primary', value: 'e-primary' },
        { text: 'Success', value: 'e-success' },
        { text: 'Warning', value: 'e-warning' },
        { text: 'Danger', value: 'e-danger' },
        { text: 'Flat', value: 'e-flat' },
        { text: 'Info', value: 'e-info' }
    ];
    public languageData: Object[] = [
        { text: 'English, US', value: 'en-US' },
        { text: 'German, DE', value: 'de-DE' },
        { text: 'Chinese, CN', value: 'zh-CN' },
        { text: 'French, FR', value: 'fr-FR' },
        { text: 'Arabic, SA', value: 'ar-SA' }
    ];
    public fields: Object = { text: 'text', value: 'value' };
    listening: boolean = false;
    liveTranscript: string = '';
    statusText: string = 'Tap mic to speak';

    onTranscriptChange(args: TranscriptChangedEventArgs): void {
        if (!args.isInterimResult) {
            args.transcript += ' ';
        }
        this.liveTranscript = args.transcript;
        this.outputTextarea.value = args.transcript;
        this.toggleCopyButtonState();
    }

    onMicColorChange(args: DDLChangeEventArgs): void {
        this.speechToText.cssClass = args.value.toString();
    }

    onLanguageChange(args: DDLChangeEventArgs): void {
        this.speechToText.lang = args.value.toString();
    }

    toggleInterimResults(args: ChangeEventArgs): void {
        this.speechToText.allowInterimResults = args.checked ?? false;
    }

    toggleTooltip(args: ChangeEventArgs): void {
        this.speechToText.showTooltip = args.checked ?? false;
    }

    toggleIconWithText(args: ChangeEventArgs): void {
        this.speechToText.buttonSettings = {
            content: args.checked ? 'Start Listening' : '',
            stopContent: args.checked ? 'Stop Listening' : ''
        };
    }

    onListeningStart(): void {
        this.listening = true;

        if (this.isSupportedBrowser) {
            if (this.outputTextarea.value) {
                this.speechToText.transcript = this.outputTextarea.value + '\n';
            }
        }

        this.statusText = '🎙 Listening... Speak now...';

        this.sttLangDdl.enabled = false;
        this.interimSwitch.disabled = true;
    }


    onListeningStop(args: StopListeningEventArgs): void {
        this.listening = false;

        if (this.isSupportedBrowser) {
            if (args.isInteracted)
                this.statusText = 'Tap mic to speak';
        } else {
            this.statusText = 'Speech not supported in this browser';
        }

        this.sttLangDdl.enabled = true;
        this.interimSwitch.disabled = false;
    }

    onErrorHandler(args: ErrorEventArgs): void {
        this.statusText = args.errorMessage;

        if (args.error === 'unsupported-browser')
            this.isSupportedBrowser = false;
    }

    copyButtonText: string = 'Copy';

    copyTranscript(): void {
        if (this.liveTranscript && navigator.clipboard) {
            navigator.clipboard.writeText(this.liveTranscript).then(() => {
                this.copyButtonText = 'Copied!';
                setTimeout(() => {
                    this.copyButtonText = 'Copy';
                }, 3000);
            });
        }
    }

    clearTranscript(): void {
        this.liveTranscript = '';

        if (this.outputTextarea) {
            this.outputTextarea.value = '';
        }

        if (this.speechToText) {
            this.speechToText.transcript = '';
        }
    }

    toggleCopyButtonState(): void {
        var hasText = this.outputTextarea.element.value.trim() !== '';
        const copyBtnElem = document.getElementById('transcript-copy-button')!;
        if (hasText) {
            copyBtnElem.removeAttribute('disabled');
        }
        else {
            copyBtnElem.setAttribute('disabled', 'true');
        }
    }
}