import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { registerLicense } from '@syncfusion/ej2-base';
import {provideHttpClient} from '@angular/common/http'

registerLicense('Ngo9BigBOggjHTQxAR8/V1JHaF5cWWdCekx0TXxbf1x2ZFZMY1xbQH9PMyBoS35RcEVgW3Zec3dVQ2ReVkZyVEFe');
 
bootstrapApplication(AppComponent, {
    providers: [
        provideHttpClient()
    ]
});