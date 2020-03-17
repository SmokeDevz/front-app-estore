import {Component, Injector, ViewChild} from '@angular/core';
import {IonSlides, IonContent} from '@ionic/angular';
import {BasePage} from '../base-page/base-page';
import {Slide} from '../../services/slide';
import {Item} from '../../services/item';
import * as Parse from 'parse';
import {Category} from '../../services/category';
import {SubCategory} from '../../services/sub-category';
import {Subject, Observable, merge} from 'rxjs';
import {
    trigger,
    style,
    animate,
    transition,
    query,
    stagger
} from '@angular/animations';
import {Brand} from 'src/app/services/brand';
import {environment} from "../../../environments/environment";

@Component({
    selector: 'page-home',
    templateUrl: 'home.html',
    styleUrls: ['home.scss'],
    animations: [
        trigger('staggerIn', [
            transition('* => *', [
                query(':enter', style({opacity: 0, transform: `translate3d(0,10px,0)`}), {optional: true}),
                query(':enter', stagger('70ms', [animate('100ms', style({
                    opacity: 1,
                    transform: `translate3d(0,0,0)`
                }))]), {optional: true})
            ])
        ])
    ]
})
export class HomePage extends BasePage {

    @ViewChild(IonContent, {static: true}) content: IonContent;
    @ViewChild(IonSlides) ionSlides: IonSlides;

    public slidesConfig = {
        centeredSlides: true,
        slidesPerView: 1.2,
        spaceBetween: 10,
        grabCursor: true,
        initialSlide: 1,
        breakpointsInverse: true,
        loop: true,
        breakpoints: {
            992: {
                slidesPerView: 1.5,
                spaceBetween: 30,
            },
        }
    };

    public slidesBrandsConfig = {
        slidesOffsetBefore: 16,
        slidesOffsetAfter: 16,
        slidesPerView: 3.4,
        spaceBetween: 8,
        grabCursor: true,
    };

    public slidesItemsConfig = {
        slidesOffsetBefore: 16,
        slidesOffsetAfter: 16,
        slidesPerView: 2.4,
        spaceBetween: 16,
        grabCursor: true,
    };

    public skeletonArray = Array(6);

    public slides: Slide[] = [];
    public categories: Category[] = [];
    public itemsOnSale: Item[] = [];
    public itemsNewArrival: Item[] = [];
    public itemsFeatured: Item[] = [];
    public items: Item[] = [];
    public brands: Brand[] = [];

    public suggestions: Item[] = [];

    private queryItems: any = {};

    protected contentLoaded: Subject<any>;
    protected loadAndScroll: Observable<any>;

    public slidesBrandsEvent: Subject<any>;
    public slidesBrandsObservable: Observable<any>;

    public slidesItemsOnSaleEvent: Subject<any>;
    public slidesItemsOnSaleObservable: Observable<any>;

    public slidesItemsNewArrivalEvent: Subject<any>;
    public slidesItemsNewArrivalObservable: Observable<any>;

    public slidesItemsFeaturedEvent: Subject<any>;
    public slidesItemsFeaturedObservable: Observable<any>;

    public isSlidesLoaded: boolean;
    public isSlidesBrandsLoaded: boolean;

    public isSlidesItemsOnSaleLoaded: boolean;
    public isSlidesItemsNewArrivalLoaded: boolean;
    public isSlidesItemsFeaturedLoaded: boolean;

    constructor(injector: Injector,
                private subCategoryService: SubCategory,
                private itemService: Item) {
        super(injector);
    }

    enableMenuSwipe(): boolean {
        return false;
    }

    ngOnInit() {
        this.setupObservable();

        this.showLoadingView({showOverlay: false});
        this.loadData();
    }

    async ionViewDidEnter() {
        const title = await this.getTrans('APP_NAME');
        this.setPageTitle(title);

        this.setMetaTags({
            title: title
        });
    }

    onSlidesDidLoad() {
        this.isSlidesLoaded = true;
        this.ionSlides.startAutoplay();
    }

    onSlidesDidChange() {
        this.contentLoaded.next();
    }

    onSlidesBrandsChange() {
        this.slidesBrandsEvent.next();
    }

    onSlidesBrandsLoaded() {
        this.isSlidesBrandsLoaded = true;
    }

    onSlidesItemsOnSaleLoaded() {
        this.isSlidesItemsOnSaleLoaded = true;
    }

    onSlidesItemsNewArrivalLoaded() {
        this.isSlidesItemsNewArrivalLoaded = true;
    }

    onSlidesItemsFeaturedLoaded() {
        this.isSlidesItemsFeaturedLoaded = true;
    }

    onSlidesItemsOnSaleChange() {
        this.slidesItemsOnSaleEvent.next();
    }

    onSlidesItemsNewArrivalChange() {
        this.slidesItemsNewArrivalEvent.next();
    }

    onSlidesItemsFeaturedChange() {
        this.slidesItemsFeaturedEvent.next();
    }

    setupObservable() {

        this.contentLoaded = new Subject();

        this.loadAndScroll = merge(
            this.content.ionScroll,
            this.contentLoaded
        );

        this.slidesBrandsEvent = new Subject();

        this.slidesBrandsObservable = merge(
            this.content.ionScroll,
            this.slidesBrandsEvent,
        );

        this.slidesItemsOnSaleEvent = new Subject();

        this.slidesItemsOnSaleObservable = merge(
            this.content.ionScroll,
            this.slidesItemsOnSaleEvent,
        );

        this.slidesItemsNewArrivalEvent = new Subject();

        this.slidesItemsNewArrivalObservable = merge(
            this.content.ionScroll,
            this.slidesItemsNewArrivalEvent,
        );

        this.slidesItemsFeaturedEvent = new Subject();

        this.slidesItemsFeaturedObservable = merge(
            this.content.ionScroll,
            this.slidesItemsFeaturedEvent,
        );
    }

    onContentLoaded() {
        setTimeout(() => {
            this.contentLoaded.next();
        }, 400);
    }

    onSlideTouched(slide: Slide) {
        if (slide.item) {
            this.navigateToRelative('./items/' + slide.item.slug);
        } else if (slide.url) {
            this.openUrl(slide.url);
        } else {
            // no action required
        }
    }

    async onCategoryTouched(category: Category) {

        try {

            if (category.subCategoryCount > 0) {

                this.navigateToRelative('./subcategories', {
                    categoryId: category.id
                });

            } else if (category.subCategoryCount === 0) {

                this.navigateToRelative('./items', {
                    cat: category.id
                });

            } else {

                await this.showLoadingView({showOverlay: false});

                const count = await this.subCategoryService.count({
                    category: category
                });

                if (count) {

                    this.navigateToRelative('./subcategories', {
                        categoryId: category.id
                    });

                } else {

                    this.navigateToRelative('./items', {
                        cat: category.id
                    });

                }

                this.showContentView();

            }

        } catch (error) {
            this.showContentView();
            this.translate.get('ERROR_NETWORK').subscribe((str) => this.showToast(str));
        }

    }

    loadData(event: any = {}) {

        this.refresher = event.target;

        Parse.Cloud.run('getHomePageData').then(data => {

            this.slides = data.slides;
            this.categories = data.categories;
            this.itemsOnSale = data.itemsOnSale;
            this.itemsNewArrival = data.itemsNewArrival;
            this.itemsFeatured = data.itemsFeatured;
            this.brands = data.brands;

            this.onRefreshComplete();
            this.showContentView();

            this.onContentLoaded();

        }, () => {
            this.onRefreshComplete();
            this.showErrorView();
        });

    }

    onLoadMore(event: any = {}) {
        this.infiniteScroll = event.target;
        this.queryItems.page++;
        this.loadItems();
    }

    loadItems() {

        this.itemService.loadInCloud(this.queryItems).then((items: Item[]) => {

            for (let item of items) {
                this.items.push(item);
            }

            this.onRefreshComplete(items);

        }).catch(error => {
            console.warn(error);
        });

    }

    async onClearSearch() {
        this.suggestions = [];
    }

    async onSearch(event: any = {}) {


        const searchTerm = event.target.value;

        if (searchTerm) {

            try {
                this.suggestions = await this.itemService.load({
                    tag: searchTerm.toLowerCase(),
                    limit: 10,
                });
            } catch (error) {
                console.log(error.message);
            }

        } else {
            this.suggestions = [];
        }

    }

    onSubmitSearch(event: any = {}) {

        if (event.key === "Enter") {

            const searchTerm = event.target.value;

            if (searchTerm) {
                this.suggestions = [];
                this.navigateToRelative('./search', {q: searchTerm});
            }
        }
    }

    trackByFn(index: number, item: any) {
        if (!item) return null;
        return item.id;
    }

    replaceUrl(never: any) {
        console.log(never);
        let urlCacheString = never;
        const cacheUrlString = urlCacheString.replace('http://localhost:1337/api/', environment.serverUrl)
        console.log(cacheUrlString);
        return cacheUrlString;
    }
}
