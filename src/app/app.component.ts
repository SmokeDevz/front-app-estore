import { Component } from '@angular/core';

import { Platform, ToastController, AlertController, LoadingController, Config } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { User } from './services/user';
import { environment } from 'src/environments/environment';
import { Category } from './services/category';
import { Item } from './services/item';
import { Card } from './services/card';
import { Preference } from './services/preference';
import { Cart } from './services/cart';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorage } from './services/local-storage';
import { Installation } from './services/installation';
import { WindowRef } from './services/window-ref';
import { HeaderColor } from '@ionic-native/header-color/ngx';
import * as Parse from 'parse';
import { Slide } from './services/slide';
import { Router } from '@angular/router';
import { StripeService } from '@nomadreservations/ngx-stripe';
import { ItemVariation } from './services/item-variation';
import { AuthService } from 'angularx-social-login';
import { GooglePlus } from '@ionic-native/google-plus/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  public user: User;

  private loader = null;
  private objWindow = null;
  private cartCount = '';

  constructor(
    private platform: Platform,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private preference: Preference,
    private loadingCtrl: LoadingController,
    private cartService: Cart,
    private statusBar: StatusBar,
    private headerColor: HeaderColor,
    private translate: TranslateService,
    private localStorage: LocalStorage,
    private userService: User,
    private windowRef: WindowRef,
    private installationService: Installation,
    private stripeService: StripeService,
    private googlePlus: GooglePlus,
    private authService: AuthService,
    private splashScreen: SplashScreen) {
    this.initializeApp();
  }

  async initializeApp() {

    this.objWindow = this.windowRef.nativeWindow;

    this.setupParse();

    this.setupFacebookSdk();

    this.user = User.getCurrent();

    this.setupLanguage();
    this.setupEvents();
    this.setupDesktopAnimations();

    await this.platform.ready()

    this.setupStatusBar();
    this.setupPush();
    this.splashScreen.hide();
    if (this.platform.is('android')) this.setupHeaderColor();
  }

  setupParse() {
    (Parse as any).serverURL = environment.serverUrl;
    Parse.initialize(environment.appId);

    Slide.getInstance();
    Category.getInstance();
    Item.getInstance();
    Card.getInstance();
    ItemVariation.getInstance();

    this.loadCart();
  }

  setupFacebookSdk() {
    if (!this.platform.is('hybrid')) {
      // Load the Facebook API asynchronous when the window starts loading

      this.objWindow.fbAsyncInit = function () {
        Parse.FacebookUtils.init({
          appId: environment.fbId,
          cookie: true,
          xfbml: true,
          version: 'v1.0'
        });
      };

      (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) { return; }
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/all.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }
  }

  setupHeaderColor() {
    this.headerColor.tint(environment.androidHeaderColor);
  }

  setupDesktopAnimations() {
    if (this.platform.is('desktop')) {
      const config = new Config;
      config.set('rippleEffect', false);
      config.set('animated', false);
    }
  }

  async setupLanguage() {
    this.translate.setDefaultLang(environment.defaultLang);

    try {

      const supportedLangs = ['en', 'es', 'ar'];
      const browserLang = navigator.language.substr(0, 2);

      let lang = await this.localStorage.getLang();

      if (lang === null && supportedLangs.indexOf(browserLang) !== -1) {
        lang = browserLang;
      }

      lang = lang || environment.defaultLang;

      if (lang === 'ar') {
        document.dir = 'rtl';
      } else {
        document.dir = 'ltr';
      }

      this.localStorage.setLang(lang);
      this.translate.use(lang);
      this.preference.lang = lang;

    } catch (error) {
      console.warn(error);
    }
  }

  setupEvents() {
    window.addEventListener('cart:updated', (e: CustomEvent) => {
      this.updateCartCount(e.detail);
    });

    window.addEventListener('cart:expired', (e: CustomEvent) => {
      const cart = e.detail;
      this.updateCartCount(cart);
      cart.save({ status: 'active' });
      this.translate.get('CART_EXPIRED')
      .subscribe(str => this.showToast(str));
    });

    window.addEventListener('user:login', (e: CustomEvent) => {
      this.user = e.detail;
      this.updateInstallation();
      this.loadCart();
    });

    window.addEventListener('user:logout', (e: CustomEvent) => {
      this.logout();
    });
  }

  setupStatusBar() {
    if (this.platform.is('ios')) {
      this.statusBar.overlaysWebView(true);
      this.statusBar.styleDefault();
    } else {
      this.statusBar.backgroundColorByHexString(environment.androidHeaderColor);
    }
  }

  async loadCart() {

    try {

      if (User.getCurrent()) {

        let cart = await this.cartService.getOne()
        cart = cart || new Cart;
        this.updateCartCount(cart);
      }

    } catch (error) {
      if (error.code === 209) {
        this.logout({ silent: true });
      }
    }

  }

  updateCartCount(cart: Cart) {
    this.cartCount = cart.items.length;
    this.preference.cartCount = this.cartCount;
  }

  async setupPush() {

    if (this.objWindow.ParsePushPlugin) {

      this.objWindow.ParsePushPlugin.resetBadge();

      this.platform.resume.subscribe(() => {
        this.objWindow.ParsePushPlugin.resetBadge();
      });

      this.objWindow.ParsePushPlugin.on('receivePN', (pn) => {
        console.log('Push notification:' + JSON.stringify(pn));
        this.objWindow.ParsePushPlugin.resetBadge();
      });

      this.objWindow.ParsePushPlugin.on('receivePN:news', (pn) => {
        console.log('News Notification:' + JSON.stringify(pn));
        this.showNotification(pn);
        this.objWindow.ParsePushPlugin.resetBadge();
      });

      this.objWindow.ParsePushPlugin.on('receivePN:order', (pn) => {
        console.log('Order Notification:' + JSON.stringify(pn));
        this.showNotification(pn);
        this.objWindow.ParsePushPlugin.resetBadge();
      });

      this.objWindow.ParsePushPlugin.on('openPN', (pn) => {
        console.log('Notification:' + JSON.stringify(pn));

        this.objWindow.ParsePushPlugin.resetBadge();

        if (pn.event === 'order') {
          this.showNotification(pn);
        }

        if (pn.event === 'post') {
          this.showNotification(pn);
        }

      });

      this.updateInstallation();
    }
  }

  async updateInstallation() {

    try {

      if (this.objWindow.ParsePushPlugin) {

        let payload: any = {
          user: null
        };

        const id = await this.installationService.getId();

        const obj = await this.installationService.getOne(id);

        if (obj) {
          payload.isPushEnabled = obj.isPushEnabled;
          this.localStorage.setIsPushEnabled(obj.isPushEnabled);
          this.preference.isPushEnabled = obj.isPushEnabled;
        }

        if (this.user) {
          payload.user = this.user.toPointer();
        }

        const res = await this.installationService.save(id, payload);
        console.log('Installation updated', res);
      }

    } catch (error) {
      console.warn(error);
    }
  }

  async showNotification(notification: any) {
    const str = await this.translate.get(['NOTIFICATION', 'OK']).toPromise();
    this.showAlert(str.NOTIFICATION, notification.alert, str.OK);
  }

  async showAlert(title: string = '', message: string = '', okText: string = 'OK') {

    const alert = await this.alertCtrl.create({
      header: title,
      message: message,
      buttons: [okText],
    });

    return await alert.present();
  }

  showConfirm(message: string): Promise<any> {

    return new Promise(async (resolve, reject) => {

      const str = await this.translate.get(['OK', 'CANCEL']).toPromise();

      const confirm = await this.alertCtrl.create({
        header: '',
        message: message,
        buttons: [{
          text: str.CANCEL,
          role: 'cancel',
          handler: () => reject(false),
        }, {
          text: str.OK,
          handler: () => resolve(true)
        }]
      });

      confirm.present();

    });
  }

  async showLoadingView() {

    const str = await this.translate.get('LOADING').toPromise();

    this.loader = await this.loadingCtrl.create({
      message: str
    });

    return await this.loader.present();
  }

  dismissLoadingView() {
    if (this.loader) {
      this.loader.dismiss().catch((e: any) => console.log('ERROR CATCH: LoadingController dismiss', e));
    }
  }

  async showToast(message: string) {

    const closeText = await this.translate.get('CLOSE').toPromise();

    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      cssClass: 'tabs-bottom',
      buttons: [{
        text: closeText,
        role: 'cancel',
      }]
    });

    return await toast.present();
  }

  goTo(page: string) {
    this.router.navigate([page]);
  }

  async logout(ev: any = {}) {

    try {

      if (!ev.silent) {
        let str = await this.translate.get('LOGOUT_CONFIRMATION').toPromise();
        await this.showConfirm(str);
      }

      const authData = this.user.attributes.authData;

      await this.showLoadingView();
      await this.userService.logout();
      window.dispatchEvent(new CustomEvent('user:loggedOut'));
      this.user = null;
      this.goTo('/');
      this.updateCartCount(new Cart);
      this.dismissLoadingView();
      this.updateInstallation();
      this.translate.get('LOGGED_OUT').subscribe(str => this.showToast(str));

      if (this.platform.is("hybrid")) {
        if (authData && authData.google) {
          this.googlePlus.disconnect();
        }
      } else {
        if (authData && authData.google) {
          this.authService.signOut(true);
        }
      }

    } catch (err) {
      this.dismissLoadingView();
    }
  }
}
