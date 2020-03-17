import { Injectable } from '@angular/core';
import * as Parse from 'parse';

@Injectable({
  providedIn: 'root'
})
export class Cart extends Parse.Object {

  constructor() {
    super('Cart');
    this.items = this.items || [];
  }

  new(): Cart {
    return new Cart();
  }

  empty(): boolean {
    return this.items.length === 0;
  }

  getOne(): Promise<Cart> {
    const query = new Parse.Query(Cart);
    query.include('customer');
    query.equalTo('customer', Parse.User.current());
    return query.first();
  }

  calculateSubtotal() {
    let total = this.items.reduce((prevVal, item) => {
      return prevVal + item.amount;
    }, 0);
    this.subtotal = total;
  }

  calculateTotal() {
    
    let total = this.items.reduce((prevVal, item) => {
      return prevVal + item.amount;
    }, 0);

    if (this.shipping && this.shipping.subzone && this.shipping.subzone.fee) {
      total += this.shipping.subzone.fee;
    }

    this.total = total;
  }

  get items(): any {
    return this.get('items');
  }

  set items(val) {
    this.set('items', val);
  }

  get subtotal(): number {
    return this.get('subtotal') || 0;
  }

  set subtotal(val) {
    this.set('subtotal', val);
  }

  get shipping(): any {
    return this.get('shipping');
  }

  set shipping(val) {
    this.set('shipping', val);
  }

  get total(): number {
    return this.get('total') || 0;
  }

  set total(val) {
    this.set('total', val);
  }

  get customer(): any {
    return this.get('customer');
  }

  get status(): string {
    return this.get('status');
  }

  set status(val: string) {
    this.set('status', val);
  }

}

Parse.Object.registerSubclass('Cart', Cart);
