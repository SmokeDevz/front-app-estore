import {Component, OnInit, Input} from '@angular/core';
import {Item} from 'src/app/services/item';
import {Observable} from 'rxjs';
import {environment} from "../../../environments/environment";

@Component({
    selector: 'app-shop-item',
    templateUrl: './shop-item.component.html',
    styleUrls: ['./shop-item.component.scss'],
})
export class ShopItemComponent implements OnInit {

    @Input() item: Item;
    @Input('customObservable') scrollObservable: Observable<any>;

    constructor() {
    }

    ngOnInit() {
    }

    replaceUrl(never: any) {

        return never.replace('http://localhost:1337/api/', environment.serverUrl);
    }

}
