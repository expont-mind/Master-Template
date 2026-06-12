export interface QPayBankUrl {
  name: string;
  description: string;
  logo: string;
  link: string;
}

export interface QPayInvoiceData {
  id: string;
  qr_image: string;
  qr_text: string;
  urls: QPayBankUrl[];
}

export interface QPayTransaction {
  id: string;
  description: string;
  transaction_bank_code: string;
  account_bank_code: string;
  account_bank_name: string;
  account_number: string;
  status: string;
  amount: string;
  currency: string;
}

export interface QPayPaymentRow {
  id: string;
  terminal_id: string;
  wallet_customer_id: string;
  amount: string;
  currency: string;
  payment_name: string;
  payment_description: string;
  paid_by: string;
  note: string | null;
  payment_status: string;
  payment_status_date: string;
  transactions: QPayTransaction[];
}

export interface QPayPaymentCheckResponse {
  id: string;
  invoice_status: string;
  invoice_status_date: string;
  payments: QPayPaymentRow[];
}

export interface CreateInvoiceParams {
  amount: number;
  description: string;
  customerName?: string;
  callbackUrl?: string;
}
