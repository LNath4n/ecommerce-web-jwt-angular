import { Component, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LANGUAGE_STORAGE_KEY, type AppLanguage } from '@core/i18n/language';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService } from '@core/services/auth/auth';
import { Router } from '@angular/router';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideUser,
  LucideShoppingCart,
  LucideLogOut,
  LucideLayoutDashboard,
  LucideSettings
} from '@lucide/angular';

@Component({
  selector: 'app-app-nav',
  templateUrl: './app-nav.component.html',
  styleUrls: ['./app-nav.component.css', '../../../../styles/bootstrap.min.css', '../../../../styles/style.css'],
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideLayoutDashboard, LucideSettings,
    MatToolbarModule,
    MatButtonModule, LucideUser, LucideShoppingCart, LucideLogOut,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    AsyncPipe,
    TranslatePipe,
  ],
})
export class AppNavComponent {

  readonly LucideUser = LucideUser;
  readonly LucideShoppingCart = LucideShoppingCart;
  readonly LucideLogOut = LucideLogOut;
  settingsOpen = false;

  readonly translate = inject(TranslateService);
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);
  private router = inject(Router);
  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay(),
  );

  logout() {
    this.authService.clearToken();
    this.router.navigate(['/login']);
  }

  changeLanguage(language: AppLanguage) {
    this.translate.use(language).subscribe({
      next: () => {
        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        } catch (error) {
          console.error('Could not save the selected language.', error);
        }
      },
      error: (error: unknown) => console.error(`Could not load the ${language} translations.`, error)
    });
    this.settingsOpen = false;
  }
}
