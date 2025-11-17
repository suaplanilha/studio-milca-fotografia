import axios from 'axios';

/**
 * Mercado Pago Payment Integration
 * Docs: https://www.mercadopago.com.br/developers/en/docs/checkout-api
 */

const MERCADO_PAGO_API_URL = 'https://api.mercadopago.com';

interface PaymentItem {
  title: string;
  quantity: number;
  unit_price: number;
  description?: string;
}

interface Payer {
  email: string;
  first_name?: string;
  last_name?: string;
  identification?: {
    type: string;
    number: string;
  };
}

/**
 * Cria um pagamento PIX no Mercado Pago
 */
export async function createPixPayment(params: {
  transactionAmount: number;
  description: string;
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<{
  id: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
}> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
  }

  try {
    const response = await axios.post(
      `${MERCADO_PAGO_API_URL}/v1/payments`,
      {
        transaction_amount: params.transactionAmount / 100, // Convert cents to reais
        description: params.description,
        payment_method_id: 'pix',
        payer: {
          email: params.email,
          first_name: params.firstName,
          last_name: params.lastName,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${Date.now()}-${Math.random()}`,
        },
      }
    );

    const payment = response.data;

    return {
      id: payment.id,
      status: payment.status,
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code || '',
      qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      ticketUrl: payment.point_of_interaction?.transaction_data?.ticket_url || '',
    };
  } catch (error: any) {
    console.error('Error creating PIX payment:', error.response?.data || error.message);
    throw new Error('Failed to create PIX payment');
  }
}

/**
 * Cria um pagamento com cartão de crédito no Mercado Pago
 */
export async function createCardPayment(params: {
  transactionAmount: number;
  description: string;
  installments: number;
  email: string;
  token: string; // Card token from frontend
  firstName?: string;
  lastName?: string;
}): Promise<{
  id: string;
  status: string;
  statusDetail: string;
}> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
  }

  try {
    const response = await axios.post(
      `${MERCADO_PAGO_API_URL}/v1/payments`,
      {
        transaction_amount: params.transactionAmount / 100,
        description: params.description,
        installments: params.installments,
        payment_method_id: 'visa', // Will be determined by card token
        token: params.token,
        payer: {
          email: params.email,
          first_name: params.firstName,
          last_name: params.lastName,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${Date.now()}-${Math.random()}`,
        },
      }
    );

    const payment = response.data;

    return {
      id: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
    };
  } catch (error: any) {
    console.error('Error creating card payment:', error.response?.data || error.message);
    throw new Error('Failed to create card payment');
  }
}

/**
 * Consulta o status de um pagamento
 */
export async function getPaymentStatus(paymentId: string): Promise<{
  id: string;
  status: string;
  statusDetail: string;
  transactionAmount: number;
}> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN not configured');
  }

  try {
    const response = await axios.get(
      `${MERCADO_PAGO_API_URL}/v1/payments/${paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const payment = response.data;

    return {
      id: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      transactionAmount: payment.transaction_amount * 100, // Convert to cents
    };
  } catch (error: any) {
    console.error('Error getting payment status:', error.response?.data || error.message);
    throw new Error('Failed to get payment status');
  }
}

/**
 * Webhook handler para notificações do Mercado Pago
 */
export async function handleMercadoPagoWebhook(
  topic: string,
  id: string
): Promise<{ status: string; paymentId: string } | null> {
  if (topic !== 'payment') {
    return null;
  }

  try {
    const payment = await getPaymentStatus(id);
    
    // Retorna o status atualizado do pagamento
    return {
      status: payment.status,
      paymentId: payment.id,
    };
  } catch (error) {
    console.error('Error handling webhook:', error);
    return null;
  }
}

/**
 * Mapeia status do Mercado Pago para status do pedido
 */
export function mapPaymentStatusToOrderStatus(mpStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'awaiting_payment',
    'approved': 'payment_approved',
    'authorized': 'payment_approved',
    'in_process': 'awaiting_payment',
    'in_mediation': 'awaiting_payment',
    'rejected': 'cancelled',
    'cancelled': 'cancelled',
    'refunded': 'cancelled',
    'charged_back': 'cancelled',
  };

  return statusMap[mpStatus] || 'awaiting_payment';
}
