import { Component, Injector, ViewChild } from '@angular/core';
import { IonSlides, IonContent } from '@ionic/angular';
import { BasePage } from '../base-page/base-page';
import { Item } from '../../services/item';
import { Cart } from '../../services/cart';
import { User } from '../../services/user';
import { SignInPage } from '../sign-in/sign-in';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { SharePage } from '../share/share.page';
import { Subject, Observable, merge } from 'rxjs';
import { Review } from 'src/app/services/review';
import { ItemVariation } from 'src/app/services/item-variation';
import { GalleryConfig, Gallery } from '@ngx-gallery/core';

@Component({
  selector: 'page-item',
  templateUrl: 'item.html',
  styleUrls: ['item.scss']
})
export class ItemPage extends BasePage {

  @ViewChild('slides') slides: IonSlides;
  @ViewChild(IonContent, { static: true }) content: IonContent;

  public item: Item;
  public itemDescription: any;
  public isAddingToCart: boolean = false;
  public isLiked: boolean = false;

  public variations: ItemVariation[] = [];
  public selectedVariation: ItemVariation;

  public reviews: Review[] = [];

  public relatedSlidesConfig = {
    slidesPerView: 2.8,
    spaceBetween: 8,
    slidesOffsetBefore: 8,
    slidesOffsetAfter: 8,
    grabCursor: true,
    breakpointsInverse: true,
    breakpoints: {
      992: {
        slidesPerView: 4.2,
        spaceBetween: 16,
      },
    }
  };

  public webSocialShare: { show: boolean, share: any, onClosed: any } = {
    show: false,
    share: {
      config: [{
        facebook: {
          socialShareUrl: '',
        },
      }, {
        twitter: {
          socialShareUrl: '',
        }
      }, {
        whatsapp: {
          socialShareText: '',
          socialShareUrl: '',
        }
      }, {
        copy: {
          socialShareUrl: '',
        }
      }]
    },
    onClosed: () => {
      this.webSocialShare.show = false;
    }
  };

  public contentLoaded: Subject<any>;
  public loadAndScroll: Observable<any>;

  protected slidesEvent: Subject<any>;
  protected slidesObservable: Observable<any>;

  public slidesRelatedEvent: Subject<any>;
  public slidesRelatedObservable: Observable<any>;

  constructor(injector: Injector,
    private gallery: Gallery,
    private socialSharing: SocialSharing,
    private itemService: Item,
    private userService: User,
    private reviewService: Review,
    private cartService: Cart) {
    super(injector);
  }

  enableMenuSwipe(): boolean {
    return false;
  }

  ngOnInit() {
    this.setupObservables();
    this.setupGallery();
  }

  setupGallery() {
    const config: GalleryConfig = {
      loadingMode: 'indeterminate'
    };

    const galleryRef = this.gallery.ref('itemGallery');
    galleryRef.setConfig(config)
  }

  setupObservables() {

    this.slidesEvent = new Subject();

    this.slidesObservable = merge(
      this.content.ionScroll,
      this.slidesEvent,
    );

    this.slidesRelatedEvent = new Subject();

    this.slidesRelatedObservable = merge(
      this.content.ionScroll,
      this.slidesRelatedEvent,
    );

    this.contentLoaded = new Subject();

    this.loadAndScroll = merge(
      this.content.ionScroll,
      this.contentLoaded
    );
  }

  onContentLoaded() {
    setTimeout(() => {
      this.contentLoaded.next();
    }, 400);
  }

  async ionViewDidEnter() {

    try {

      if (this.item) return;

      await this.showLoadingView({ showOverlay: false });

      const itemId = await this.getParams().itemId;
      this.item = await this.itemService.loadOne(itemId);

      if (this.item.hasVariations()) {
        this.variations = this.item.variations
        .filter(variation => variation.isActive)
      }

      this.loadReviews();

      if (this.item.description) {
        this.itemDescription = this.sanitizer.bypassSecurityTrustHtml(this.item.description);
      }

      this.setPageTitle(this.item.name);

      this.setMetaTags({
        title: this.item.name,
        description: this.item.description,
        image: this.item.featuredImage ? this.item.featuredImage.url() : '',
        slug: this.item.slug
      });

      this.showContentView();
      this.onContentLoaded();
      this.checkIfItemIsLiked();
      this.trackView();

    } catch (error) {
      this.showErrorView();
    }

  }

  onSlidesDidLoad() {
    this.slidesEvent.next();
  }

  onSlidesWillChange() {
    this.slidesEvent.next();
  }

  onSlidesRelatedDrag() {
    this.slidesRelatedEvent.next();
  }

  async loadReviews() {
    try {
      this.reviews = await this.reviewService.load({
        item: this.item, limit: 10
      });
      this.onContentLoaded();
    } catch (err) {
      console.warn(err.message);
    }
  }

  async presentSignInModal() {

    await this.showLoadingView({ showOverlay: true });

    const modal = await this.modalCtrl.create({
      component: SignInPage,
      componentProps: {
        showLoginForm: true
      }
    });

    await modal.present();

    this.showContentView();
  }

  async checkIfItemIsLiked() {

    if (User.getCurrent()) {

      try {
        this.isLiked = await this.itemService.isLiked(this.item.id);
      } catch (error) {
        console.warn(error.message);
      }

    }
  }

  async trackView() {
    try {
      await this.itemService.trackView(this.item.id);
    } catch (error) {
      console.warn(error.message);
    }
  }

  async onShare() {

    const url = this.getShareUrl(this.item.slug);

    if (this.isHybrid()) {

      try {
        await this.socialSharing.share(this.item.name, null, null, url);
      } catch (err) {
        console.warn(err)
      }

    } else if (this.isPwa() || this.isMobile()) {

      this.webSocialShare.share.config.forEach((item: any) => {
        if (item.whatsapp) {
          item.whatsapp.socialShareUrl = url;
        } else if (item.facebook) {
          item.facebook.socialShareUrl = url;
        } else if (item.twitter) {
          item.twitter.socialShareUrl = url;
        } else if (item.copy) {
          item.copy.socialShareUrl = url;
        }
      });

      this.webSocialShare.show = true;
    } else {
      this.openShareModal(url);
    }

  }

  async openShareModal(url: string) {

    await this.showLoadingView({ showOverlay: true });

    const modal = await this.modalCtrl.create({
      component: SharePage,
      componentProps: { url }
    })

    await modal.present();

    this.showContentView();
  }

  async onLike() {

    if (User.getCurrent()) {

      try {
        this.isLiked = !this.isLiked;
        await this.itemService.like(this.item.id);
      } catch (error) {
        console.log(error.message);
      }

    } else {
      this.presentSignInModal();
    }

  }

  onVariationTouched(variation: ItemVariation) {
    this.selectedVariation = variation;
  }

  async onAddToCart() {

    try {

      if (this.item.hasVariations() && !this.selectedVariation) {
        return this.translate.get('CHOOSE_VARIATION').subscribe(str => this.showToast(str));
      }

      this.isAddingToCart = true;

      if (!User.getCurrent()) {
        const user = await this.userService.loginAnonymously();
        window.dispatchEvent(new CustomEvent('user:login', { detail: user }));
      }

      const rawItem = Object.assign({}, this.item.toJSON());

      const allowed: any = ['objectId'];

      const filteredItem: any = Object.keys(rawItem)
        .filter(key => allowed.includes(key))
        .reduce((obj, key) => {
          obj[key] = rawItem[key];
          return obj;
        }, {});

      filteredItem.qty = 1;

      if (this.selectedVariation) {
        filteredItem.variation = this.selectedVariation.toJSON();
      }

      let cart = await this.cartService.getOne();
      cart = cart || new Cart;

      const existInCart = cart.items.find((item: any) => {

        if (item.variation) {
          return item.objectId === filteredItem.objectId && item.variation.objectId === filteredItem.variation.objectId;
        }
        return item.objectId === filteredItem.objectId
      })

      if (existInCart) {
        this.isAddingToCart = false;
        return this.translate.get('ITEM_ALREADY_IN_CART')
          .subscribe(str => this.showToast(str));
      }

      cart.items.push(filteredItem);

      await cart.save();

      window.dispatchEvent(new CustomEvent('cart:updated', {
        detail: cart
      }));

      this.isAddingToCart = false;

      const { value } = await this.showSweetSuccessView();

      if (value) {
        this.setRoot('/1/cart/checkout');
      }

    } catch (err) {
      this.isAddingToCart = false;
      this.translate.get('ERROR_NETWORK').subscribe(str => this.showAlert(str));
    }
  }

  trackByFn(index: number, item: any) {
    if (!item) return null;
    return item.id;
  }

}
