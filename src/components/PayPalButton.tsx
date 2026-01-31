import { useState } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { verifyPayment } from '../services/paymentService';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export default function PayPalButton() {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [message, setMessage] = useState<string>('');

  return (
    <div className="payment-section">
      <h2>Support The Perfect Snake</h2>
      <p>Enjoy the game? Support development for just $5!</p>

      <div style={{ maxWidth: '400px', margin: '20px auto' }}>
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay'
          }}
          disabled={status === 'processing' || status === 'success'}
          createOrder={(_data, actions) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  amount: {
                    currency_code: 'USD',
                    value: '5.00'
                  }
                }
              ]
            });
          }}
          onApprove={async (_data, actions) => {
            setStatus('processing');
            setMessage('Processing your payment...');

            try {
              // Capture the order
              const order = await actions.order!.capture();

              if (!order.id) {
                throw new Error('Order ID not found');
              }

              // Verify payment with our backend
              const verification = await verifyPayment({
                orderId: order.id
              });

              if (verification.success) {
                setStatus('success');
                setMessage('Payment successful! Thank you for your support! 🎉');
              } else {
                setStatus('error');
                setMessage(`Payment verification failed: ${verification.message}`);
              }
            } catch (error) {
              setStatus('error');
              setMessage(
                error instanceof Error
                  ? `Error: ${error.message}`
                  : 'An unexpected error occurred'
              );
            }
          }}
          onCancel={() => {
            setStatus('error');
            setMessage('Payment was cancelled');
          }}
          onError={(err) => {
            setStatus('error');
            setMessage('Payment error occurred. Please try again.');
            console.error('PayPal error:', err);
          }}
        />
      </div>

      {message && (
        <div className={`payment-status ${status}`}>
          {message}
        </div>
      )}
    </div>
  );
}
