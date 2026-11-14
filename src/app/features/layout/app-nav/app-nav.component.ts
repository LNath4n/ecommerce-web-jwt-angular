import { Component, effect, inject } from '@angular/core';
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
import { ClientesService } from '@core/services/cliente/ClientesService';
import { Router } from '@angular/router';
import { LucideLogIn } from '@lucide/angular';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideStore, LucideStar } from '@lucide/angular';
import {
  LucideUser,
  LucideShoppingCart,
  LucideLogOut,
  LucideLayoutDashboard,
  LucideSettings,
  LucidePackage
} from '@lucide/angular';

@Component({
  selector: 'app-app-nav',
  templateUrl: './app-nav.component.html',
  styleUrls: ['./app-nav.component.css', '../../../../styles/bootstrap.min.css', '../../../../styles/style.css'],
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideLayoutDashboard, LucideSettings,
    MatToolbarModule,
    MatButtonModule, LucideUser, LucideShoppingCart, LucideLogOut, LucidePackage,
    MatSidenavModule,
    MatListModule,LucideStore , LucideStar,
    MatIconModule,
    AsyncPipe,
    TranslatePipe,
  ],
})
export class AppNavComponent {

  readonly LucideUser = LucideUser;
  readonly LucideShoppingCart = LucideShoppingCart;
  readonly LucideLogOut = LucideLogOut;
  readonly LucideLogIn = LucideLogIn;
  settingsOpen = false;

  readonly translate = inject(TranslateService);
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);
  private clientesService = inject(ClientesService);
  private router = inject(Router);
  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;

  private readonly sincronizarPerfil = effect(onCleanup => {
    if (!this.isLoggedIn()) {
      this.authService.clearClientePublico();
      return;
    }

    const subscription = this.clientesService.obtenerPerfil().subscribe({
      next: perfil => this.authService.setClientePublico(perfil),
      error: error => console.error('Could not load the authenticated customer profile.', error),
    });
    onCleanup(() => subscription.unsubscribe());
  });

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
