/**
 * D-ELYNX TAILORS HUB - Client Payment Integration Service
 *
 * Communicates with server-side `/api/payments/*` endpoints to initialize
 * and verify transactions without exposing gateway secret keys to the browser.
 */

import { Order } from '../types/ecommerce';

export interface PaymentInitializationResponse {
  success: boolean;
  reference: string;
  authorizationUrl: string;
  accessCode?: string;
  amount: number;
  currency: string;
  provider: string;
  error?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  orderId?: string;
  reference: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  gatewayResponse?: string;
  error?: string;
}

export class PaymentService {
  /**
   * Request server to initialize payment for an order
   */
  public static async initializePayment(
    order: Order,
    provider: 'paystack' | 'flutterwave' | 'monnify' = 'paystack'
  ): Promise<PaymentInitializationResponse> {
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          provider,
          userId: order.user_id,
          userEmail: order.shipping_address?.recipient_name ? `${order.user_id}@d-elynx.fashion` : 'customer@d-elynx.fashion',
          orderTotal: order.total,
          orderCurrency: order.currency,
          orderStatus: order.status,
          callbackUrl: `${window.location.origin}/account/orders/${order.id}`,
        }),
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        reference: '',
        authorizationUrl: '',
        amount: order.total,
        currency: order.currency,
        provider,
        error: err.message || 'Unable to connect to payment gateway.',
      };
    }
  }

  /**
   * Request server to verify payment reference
   */
  public static async verifyPayment(
    reference: string,
    userId: string
  ): Promise<PaymentVerificationResponse> {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference,
          userId,
        }),
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        reference,
        amount: 0,
        currency: 'NGN',
        status: 'failed',
        error: err.message || 'Unable to verify payment reference.',
      };
    }
  }
}
