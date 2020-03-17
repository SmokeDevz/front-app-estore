import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Preference } from '../services/preference';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  constructor(public platform: Platform,
    public preference: Preference) {}
}
