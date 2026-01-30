import type { VercelRequest, VercelResponse } from '@vercel/node';

interface PaymentVerificationRequest {
  orderId: string;
}

interface PaymentDetails {
  orderId: string;
  payerId: string;
  amount: string;
  status: string;
  timestamp: number;
}

interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  details?: PaymentDetails;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<PaymentVerificationResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const { orderId } = req.body as PaymentVerificationRequest;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID is required'
    });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const paypalApiBase = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

  if (!clientId || !clientSecret) {
    console.error('PayPal credentials not configured');
    return res.status(500).json({
      success: false,
      message: 'Payment verification service not configured'
    });
  }

  try {
    // Step 1: Get OAuth access token
    const authResponse = await fetch(`${paypalApiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with PayPal');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Step 2: Verify order details
    const orderResponse = await fetch(`${paypalApiBase}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to fetch order details from PayPal');
    }

    const orderData = await orderResponse.json();

    // Step 3: Validate order
    const status = orderData.status;
    const amount = orderData.purchase_units?.[0]?.amount?.value;
    const payerId = orderData.payer?.payer_id;
    const payerEmail = orderData.payer?.email_address;

    // Validate that order is completed
    if (status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Order status is ${status}, expected COMPLETED`
      });
    }

    // Validate that amount is exactly $10.00
    if (amount !== '10.00') {
      return res.status(400).json({
        success: false,
        message: `Invalid payment amount: $${amount}, expected $10.00`
      });
    }

    // Step 4: Log payment details
    const paymentDetails: PaymentDetails = {
      orderId,
      payerId,
      amount,
      status,
      timestamp: Date.now()
    };

    console.log('✅ Payment Verified:', {
      ...paymentDetails,
      payerEmail
    });

    // Step 5: Return success response
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      details: paymentDetails
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Payment verification failed'
    });
  }
}
