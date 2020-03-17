import { Injectable } from '@angular/core';
import * as Parse from 'parse';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService extends Parse.Object {

  constructor() {
    super('AppConfig');
  }

  load(): Promise<AppConfigService> {
    return Parse.Cloud.run('getAppConfig');
  }

  get about(): any {
    return this.get('about');
  }
}

Parse.Object.registerSubclass('AppConfig', AppConfigService);