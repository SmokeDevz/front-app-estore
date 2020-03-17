import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ItemPage } from './item';
import { SharedModule } from '../../shared.module';
import { SignInPageModule } from '../sign-in/sign-in.module';
import { SharePageModule } from '../share/share.module';
import { GalleryModule } from  '@ngx-gallery/core';
import { LightboxModule } from  '@ngx-gallery/lightbox';
import { GallerizeModule } from  '@ngx-gallery/gallerize';

@NgModule({
  declarations: [
    ItemPage,
  ],
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: ItemPage
      }
    ]),
    SharedModule,
    SignInPageModule,
    SharePageModule,
    GalleryModule,
    LightboxModule,
    GallerizeModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ItemPageModule {}
