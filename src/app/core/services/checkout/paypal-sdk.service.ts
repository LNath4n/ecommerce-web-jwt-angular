import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

export interface PayPalApprovalData {
  orderID: string;
}

export interface PayPalCancelData {
  orderID?: string;
}

export interface PayPalButtonOptions {
  createOrder: () => Promise<string>;
  onApprove: (data: PayPalApprovalData) => Promise<void>;
  onCancel: (data: PayPalCancelData) => Promise<void>;
  onError: (error: unknown) => void;
}

export interface PayPalButtonsInstance {
  render(container: HTMLElement): Promise<void>;
}

export interface PayPalNamespace {
  Buttons(options: PayPalButtonOptions): PayPalButtonsInstance;
}

type PayPalWindow = Window & { paypal?: PayPalNamespace };

@Injectable({ providedIn: 'root' })
export class PayPalSdkService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private loading: Promise<PayPalNamespace> | null = null;
  private loadedClientId: string | null = null;

  load(clientId: string): Promise<PayPalNamespace> {
    const configuredClientId = clientId.trim();
    if (!configuredClientId) {
      return Promise.reject(new Error('PAYPAL_CLIENT_ID_REQUIRED'));
    }

    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(new Error('PAYPAL_BROWSER_REQUIRED'));
    }

    if (this.loadedClientId && this.loadedClientId !== configuredClientId) {
      return Promise.reject(new Error('PAYPAL_CLIENT_ID_MISMATCH'));
    }

    const browserWindow = this.document.defaultView as PayPalWindow | null;
    if (browserWindow?.paypal) {
      this.loadedClientId = configuredClientId;
      this.loading ??= Promise.resolve(browserWindow.paypal);
      return this.loading;
    }

    if (this.loading) {
      return this.loading;
    }

    const script = this.document.createElement('script');
    const scriptUrl = new URL('https://www.paypal.com/sdk/js');
    scriptUrl.searchParams.set('client-id', configuredClientId);
    scriptUrl.searchParams.set('currency', 'MXN');
    scriptUrl.searchParams.set('intent', 'capture');
    scriptUrl.searchParams.set('components', 'buttons');
    script.src = scriptUrl.toString();
    script.async = true;

    this.loadedClientId = configuredClientId;
    this.loading = new Promise<PayPalNamespace>((resolve, reject) => {
      script.onload = () => {
        const paypal = browserWindow?.paypal;
        if (!paypal) {
          reject(new Error('PAYPAL_SDK_GLOBAL_MISSING'));
          return;
        }
        resolve(paypal);
      };
      script.onerror = () => reject(new Error('PAYPAL_SDK_LOAD_FAILED'));
      this.document.head.appendChild(script);
    }).catch(error => {
      this.loading = null;
      this.loadedClientId = null;
      script.remove();
      throw error;
    });

    return this.loading;
  }
}
