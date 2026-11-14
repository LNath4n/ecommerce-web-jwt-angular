
import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-page-hero',
  imports: [TranslatePipe],
  template: `
    <div class="hero">
      <div class="container">
        <div class="row justify-content-between">
          <div class="col-lg-7">
            <div class="intro-excerpt">
              <h1>{{ titulo() | translate }}</h1>
              <ng-content />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PageHero {
  titulo = input.required<string>();
}