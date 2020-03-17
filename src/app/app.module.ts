import { NgModule, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { Camera } from '@ionic-native/camera/ngx';
import { Facebook } from '@ionic-native/facebook/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { HeaderColor } from '@ionic-native/header-color/ngx';
import { SafariViewController } from '@ionic-native/safari-view-controller/ngx';
import { GooglePlus } from '@ionic-native/google-plus/ngx';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faFacebookF } from '@fortawesome/free-brands-svg-icons/faFacebookF';
import { faTwitter } from '@fortawesome/free-brands-svg-icons/faTwitter';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons/faWhatsapp';

const icons = [faFacebookF, faTwitter, faWhatsapp];
library.add(...icons);

import 'hammerjs';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NgxStripeModule } from '@nomadreservations/ngx-stripe';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { LazyLoadImageModule, scrollPreset } from 'ng-lazyload-image';
import { IonicStorageModule } from '@ionic/storage';
import { ImgFallbackModule } from 'ngx-img-fallback';

import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

import { SocialLoginModule, AuthServiceConfig } from 'angularx-social-login';
import { GoogleLoginProvider } from 'angularx-social-login';

const config = new AuthServiceConfig([{
  id: GoogleLoginProvider.PROVIDER_ID,
  provider: new GoogleLoginProvider(environment.googleClientId)
}]);

export function provideConfig() {
  return config;
}

import localeAr from '@angular/common/locales/ar';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeAr, 'ar');
registerLocaleData(localeEs, 'es');

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(),
    NgxStripeModule.forRoot(environment.stripePublicKey),
    AppRoutingModule,
    HttpClientModule,
    SocialLoginModule,
    LazyLoadImageModule.forRoot({
      preset: scrollPreset
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    IonicStorageModule.forRoot(),
    ImgFallbackModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [
    StatusBar,
    SplashScreen,
    AppVersion,
    Camera,
    Facebook,
    InAppBrowser,
    SocialSharing,
    HeaderColor,
    SafariViewController,
    GooglePlus,
    {
      provide: AuthServiceConfig,
      useFactory: provideConfig
    },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
