import { Component, inject } from '@angular/core';
import { LucideCircleCheck, LucideCircleX, LucideTriangleAlert, LucideX } from '@lucide/angular';
import { AlertaService } from '@core/services/modals/ModalsService';

@Component({
  selector: 'app-alerta-modal',
  imports: [LucideCircleCheck, LucideCircleX, LucideTriangleAlert, LucideX],
  templateUrl: './alerta-modal.html',
  styleUrl: './alerta-modal.css',
})
export class AlertaModal {
  private alertaService = inject(AlertaService);
  alertas = this.alertaService.alertas;
  alertasCerrando = this.alertaService.alertasCerrando;
  confirmacion = this.alertaService.confirmacion;

  cerrar(id: number) {
    this.alertaService.cerrar(id);
  }

  responderConfirmacion(confirmada: boolean) {
    this.alertaService.responderConfirmacion(confirmada);
  }
}