export interface PaymentDetails {
  orderId: string;
  payerId: string;
  amount: string;
  status: string;
  timestamp: number;
}

export interface PaymentVerificationRequest {
  orderId: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  details?: PaymentDetails;
}
