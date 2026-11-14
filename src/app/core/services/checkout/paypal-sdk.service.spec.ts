import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { PayPalNamespace, PayPalSdkService } from './paypal-sdk.service';

describe('PayPalSdkService', () => {
  let service: PayPalSdkService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PayPalSdkService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    document.querySelectorAll('script[src*="paypal.com/sdk/js"]').forEach(script => script.remove());
    if (document.defaultView) {
      Object.defineProperty(document.defaultView, 'paypal', {
        configurable: true,
        value: undefined,
      });
    }
  });

  it('loads the SDK script once for the configured client ID', async () => {
    const sdk = { Buttons: () => ({ render: async () => undefined }) } satisfies PayPalNamespace;
    const firstLoad = service.load('public-client-id');
    const secondLoad = service.load('public-client-id');
    const scripts = document.querySelectorAll<HTMLScriptElement>('script[src*="paypal.com/sdk/js"]');

    expect(firstLoad).toBe(secondLoad);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toContain('client-id=public-client-id');
    expect(scripts[0].src).toContain('currency=MXN');

    Object.defineProperty(document.defaultView, 'paypal', {
      configurable: true,
      value: sdk,
    });
    scripts[0].dispatchEvent(new Event('load'));

    await expect(firstLoad).resolves.toBe(sdk);
    await expect(service.load('public-client-id')).resolves.toBe(sdk);
    await expect(service.load('different-client-id')).rejects.toThrow('PAYPAL_CLIENT_ID_MISMATCH');
    expect(document.querySelectorAll('script[src*="paypal.com/sdk/js"]')).toHaveLength(1);
  });

  it('rejects an empty client ID without loading the script', async () => {
    await expect(service.load(' ')).rejects.toThrow('PAYPAL_CLIENT_ID_REQUIRED');
    expect(document.querySelector('script[src*="paypal.com/sdk/js"]')).toBeNull();
  });
});
