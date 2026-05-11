export interface CreditBalanceResponse {
  balance: number;
}

export interface CreditPackage {
  id: number;
  credits: number;
  priceKopecks: number;
}

export type CreditTransactionType = "usage" | "purchase" | string;
export type CreditTransactionStatus = "completed" | "pending" | string;

export interface CreditTransaction {
  id: string;
  userId: number;
  amount: number;
  type: CreditTransactionType;
  description?: string;
  paymentLabel?: string;
  status: CreditTransactionStatus;
  createdAt: string;
}

export interface CreditPurchasePayload {
  packageId: number;
}

export interface CreditPurchaseResponse {
  payUrl: string;
}
