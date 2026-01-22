import axios, { AxiosInstance } from 'axios';
import { PaymentMethod } from '../types';

interface PaymentInitiationParams {
  amount: number;
  currency: string;
  phoneNumber: string;
  email: string;
  reference: string;
  description: string;
  callbackUrl: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  reference?: string;
  message?: string;
  error?: string;
}

/**
 * Service for handling Mobile Money payment integration
 */
class PaymentService {
  private apiClient: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MOBILE_MONEY_API_KEY || '';
    this.apiSecret = process.env.MOBILE_MONEY_API_SECRET || '';
    this.baseUrl = process.env.MOBILE_MONEY_BASE_URL || 'https://api.mobilemoney.com/v1';

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      timeout: 30000
    });
  }

  /**
   * Initiate a Mobile Money payment
   */
  async initiatePayment(params: PaymentInitiationParams): Promise<PaymentResponse> {
    try {
      // In a real implementation, this would call the actual Mobile Money API
      // For now, we'll simulate the API response
      console.log('Initiating payment with Mobile Money API:', params);

      const response = await this.apiClient.post('/payments/initiate', {
        amount: params.amount,
        currency: params.currency,
        phone_number: params.phoneNumber,
        email: params.email,
        reference: params.reference,
        description: params.description,
        callback_url: params.callbackUrl
      });

      return {
        success: true,
        transactionId: response.data.transaction_id,
        paymentUrl: response.data.payment_url,
        reference: response.data.reference,
        message: 'Payment initiated successfully'
      };
    } catch (error: any) {
      console.error('Payment initiation error:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initiate payment'
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(transactionId: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/payments/${transactionId}/status`);
      return response.data;
    } catch (error: any) {
      console.error('Payment verification error:', error.message);
      throw new Error('Failed to verify payment');
    }
  }

  /**
   * Process refund
   */
  async processRefund(transactionId: string, amount: number, reason: string): Promise<any> {
    try {
      const response = await this.apiClient.post('/payments/refund', {
        transaction_id: transactionId,
        amount,
        reason
      });
      return response.data;
    } catch (error: any) {
      console.error('Refund processing error:', error.message);
      throw new Error('Failed to process refund');
    }
  }
}

export default new PaymentService();
