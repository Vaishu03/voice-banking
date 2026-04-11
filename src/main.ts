import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { registerLicense } from '@syncfusion/ej2-base';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router'; // 1. Import provideRouter
import { routes } from './app/app-routing.module';      // 2. Import your routes array

registerLicense('Ngo9BigBOggjHTQxAR8/V1JHaF5cWWdCekx0TXxbf1x2ZFZMY1xbQH9PMyBoS35RcEVgW3Zec3dVQ2ReVkZyVEFe');
 
bootstrapApplication(AppComponent, {
    providers: [
        provideHttpClient(),
        provideRouter(routes) // 3. Add the router provider here
    ]
}).catch(err => console.error(err));
