import { Component, Injector, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BasePage } from '../base-page/base-page';
import { User } from '../../services/user';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook/ngx';
import { ForgotPasswordPage } from '../forgot-password/forgot-password';
import { AuthService, GoogleLoginProvider } from 'angularx-social-login';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { Subscription } from 'rxjs';

@Component({
  selector: 'page-sign-in',
  templateUrl: 'sign-in.html',
})
export class SignInPage extends BasePage {

  public form: FormGroup;

  @Input() showLoginForm: boolean;
  @Input() showSignUpForm: boolean;

  public isLoadingByUsername: boolean = false;
  public isLoadingByFacebook: boolean = false;
  public isLoadingByGoogle: boolean = false;
  public isSignUpLoading: boolean = false;

  public showPass: boolean;

  public googleSubscription: Subscription;

  constructor(injector: Injector,
    private fb: Facebook,
    private authService: AuthService,
    private googlePlus: GooglePlus,
    private userService: User) {
    super(injector);
  }

  ngOnInit() {

    if (this.showLoginForm) {
      this.setupLoginForm();
    } else if (this.showSignUpForm) {
      this.setupSignUpForm();
    }

    this.googleSubscription = this.authService.authState.subscribe(user => {
      if (user) {
        this.loggedIntoGoogle(user);
      }
    });
  }

  ngOnDestroy() {
    this.googleSubscription.unsubscribe();
  }

  enableMenuSwipe() {
    return false;
  }

  onDismiss() {
    this.modalCtrl.dismiss();
  }

  onLoginButtonTouched() {
    this.showLoginForm = true;
    this.showSignUpForm = false;
    this.setupLoginForm();
  }

  onSignUpButtonTouched() {
    this.showLoginForm = false;
    this.showSignUpForm = true;
    this.setupSignUpForm();
  }

  setupLoginForm() {
    this.form = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });
  }

  setupSignUpForm() {
    this.form = new FormGroup({
      name: new FormControl('', Validators.required),
      username: new FormControl('', Validators.required),
      email: new FormControl(''),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });
  }

  onFacebookButtonTouched() {

    if (!this.isHybrid()) {
      this.userService.loginViaFacebook()
        .then((user: User) => this.loggedViaFacebook(user))
        .catch(e => console.log('Error logging into Facebook', e));
    } else {
      this.fb.login(['public_profile'])
        .then((res: FacebookLoginResponse) => this.loggedIntoFacebook(res))
        .catch(e => console.log('Error logging into Facebook', e));
    }

  }

  async loggedIntoFacebook(res: FacebookLoginResponse) {

    let expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + res.authResponse.expiresIn);

    const expirationDateFormatted = expirationDate.toISOString();

    const facebookAuthData = {
      id: res.authResponse.userID,
      access_token: res.authResponse.accessToken,
      expiration_date: expirationDateFormatted
    };

    try {

      await this.showLoadingView({ showOverlay: false });
      this.isLoadingByFacebook = true;

      const user = await this.userService.loginWith('facebook', {
        authData: facebookAuthData
      });

      this.loggedViaFacebook(user);
      this.isLoadingByFacebook = false;

    } catch (error) {
      this.loginViaFacebookFailure(error);
      this.isLoadingByFacebook = false;
    }

  }

  loginViaFacebookFailure(error: any) {
    console.log('Error logging into Facebook', error);
    this.translate.get('ERROR_NETWORK').subscribe(str => this.showToast(str));
    this.showContentView();
  }

  loggedViaFacebook(user: User) {
    this.showContentView();

    const transParams = { name: user.attributes.name };

    this.translate.get('LOGGED_IN_AS', transParams)
      .subscribe(str => this.showToast(str));

    window.dispatchEvent(new CustomEvent('user:login', {
      detail: user
    }));

    this.onDismiss();
  }

  async onGoogleButtonTouched() {
    if (this.isHybrid()) {
      try {
        const res = await this.googlePlus.login({});
        this.loggedIntoGoogle({
          id: res.userId,
          authToken: res.accessToken
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);
    }
  }

  async loggedIntoGoogle(res: any) {
    console.log("Logged into Google", res);

    try {
      this.isLoadingByGoogle = true;

      const authData = {
        id: res.id,
        access_token: res.authToken
      };

      const user = await this.userService.loginWith("google", { authData });

      this.isLoadingByGoogle = false;

      const transParams = { name: user.name };

      this.translate
        .get("LOGGED_IN_AS", transParams)
        .subscribe(str => this.showToast(str));

      this.onDismiss();

      window.dispatchEvent(new CustomEvent('user:login', {
        detail: user
      }));

    } catch (err) {
      console.log("Error logging into Google", err);
      this.isLoadingByGoogle = false;
      this.translate.get("ERROR_NETWORK").subscribe(str => this.showToast(str));
      this.showContentView();
    }
  }

  async onLogin() {

    try {

      if (this.form.invalid) {
        const message = await this.getTrans('INVALID_FORM');
        return this.showToast(message);
      }

      await this.showLoadingView({ showOverlay: false });
      this.isLoadingByUsername = true;

      let user = await this.userService.signIn(this.form.value);

      this.showContentView();
      this.isLoadingByUsername = false;

      const transParams = { name: user.name };
      this.translate.get('LOGGED_IN_AS', transParams)
        .subscribe(str => this.showToast(str));

      this.onDismiss();

      window.dispatchEvent(new CustomEvent('user:login', {
        detail: user
      }));

    } catch (err) {

      if (err.code === 101) {
        this.translate.get('INVALID_CREDENTIALS')
          .subscribe(str => this.showToast(str));
      } else {
        this.translate.get('ERROR_NETWORK')
          .subscribe(str => this.showToast(str));
      }

      this.showContentView();
      this.isLoadingByUsername = false;
    }
  }

  async onSignUp() {

    try {

      if (this.form.invalid) {
        const message = await this.getTrans('INVALID_FORM');
        return this.showToast(message);
      }

      const formData = Object.assign({}, this.form.value);

      if (formData.email === '') {
        delete formData.email;
      }

      await this.showLoadingView({ showOverlay: false });
      this.isSignUpLoading = true;

      let user = null;

      const currentUser = User.getCurrent();

      if (currentUser && currentUser.attributes.authData &&
        currentUser.attributes.authData['anonymous'] !== undefined) {
        formData.authData = { anonymous: null };
        user = await currentUser.signUp(formData);
      } else {
        user = await this.userService.create(formData);
      }

      this.showContentView();
      this.isSignUpLoading = false;

      const transParams = { name: user.name };
      this.translate.get('LOGGED_IN_AS', transParams).subscribe(str => this.showToast(str));

      this.onDismiss();

      window.dispatchEvent(new CustomEvent('user:login', {
        detail: user
      }));

    } catch (err) {

      console.log(err);

      this.showContentView();
      this.isSignUpLoading = false;

      if (err.code === 202) {
        this.translate.get('USERNAME_TAKEN').subscribe(str => this.showToast(str));
      } else if (err.code === 203) {
        this.translate.get('EMAIL_TAKEN').subscribe(str => this.showToast(str));
      } else if (err.code === 125) {
        this.translate.get('EMAIL_INVALID').subscribe(str => this.showToast(str));
      } else {
        this.translate.get('ERROR_NETWORK').subscribe(str => this.showToast(str));
      }
    }
  }

  async onForgotPasswordButtonTouched() {

    await this.showLoadingView({ showOverlay: true });

    const modal = await this.modalCtrl.create({
      component: ForgotPasswordPage,
    });

    await modal.present();

    this.showContentView();
  }

}