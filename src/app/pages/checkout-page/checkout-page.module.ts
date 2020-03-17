import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CheckoutPage } from './checkout-page';
import { SharedModule } from '../../shared.module';
import { CardListModalPageModule } from '../card-list-modal/card-list.module';
import { AddressListModalPageModule } from '../address-list-modal/address-list.module';
import { AddressAddPageModule } from '../address-add/address-add.module';
import { CardAddPageModule } from '../card-add/card-add.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    CheckoutPage,
  ],
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: CheckoutPage
      }
    ]),
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    AddressListModalPageModule,
    AddressAddPageModule,
    CardListModalPageModule,
    CardAddPageModule,
  ],
})
export class CheckoutPageModule {}
