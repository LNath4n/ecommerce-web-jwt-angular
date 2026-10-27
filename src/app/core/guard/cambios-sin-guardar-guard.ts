import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface ComponenteConCambios {
  hayCambiosSinGuardar(): boolean;
}

export const cambiosSinGuardarGuard: CanDeactivateFn<ComponenteConCambios> = (component) => {
  if (component.hayCambiosSinGuardar()) {
    return confirm(inject(TranslateService).instant('ADMIN_PRODUCTS.UNSAVED_CHANGES_CONFIRM'));
  }
  return true;
};