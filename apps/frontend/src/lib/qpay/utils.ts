import type { QPayPaymentRow } from "./types";

// QPay банк кодоос ойлгомжтой нэр рүү
const BANK_CODE_NAMES: Record<string, string> = {
  "010000": "Монгол банк",
  "020000": "Капитал банк",
  "040000": "Худалдаа хөгжлийн банк",
  "050000": "Хаан банк",
  "150000": "Голомт банк",
  "190000": "Тээвэр хөгжлийн банк",
  "210000": "Ариг банк",
  "220000": "Кредит банк",
  "290000": "ҮХО банк",
  "300000": "Капитрон банк",
  "320000": "Хас банк",
  "330000": "Чингисхаан банк",
  "340000": "Төрийн банк",
  "360000": "Хөгжлийн банк",
  "380000": "Богд банк",
  "390000": "М банк",
  "500000": "Мобифинанс",
  "900000": "Төрийн сан",
  "993000": "Инвэскор ББСБ",
};

/**
 * QPay-н payment object-оос бодит банк/аппын нэрийг тодорхойлно.
 * paid_by нь "P2P" байвал transaction_bank_code, account_bank_name,
 * payment_name зэргээс нэрийг олно.
 */
export function resolvePaymentWallet(payment: QPayPaymentRow): string {
  const paidBy = payment.paid_by?.trim();

  // paid_by тодорхой нэр байвал шууд буцаана
  if (paidBy && paidBy.toLowerCase() !== "p2p") {
    return paidBy;
  }

  // Транзакцийн банк кодоос нэрийг олох
  const txn = payment.transactions?.[0];
  if (txn?.transaction_bank_code) {
    const bankName = BANK_CODE_NAMES[txn.transaction_bank_code];
    if (bankName) return bankName;
  }

  // account_bank_name байвал ашиглах
  if (txn?.account_bank_name) {
    return txn.account_bank_name;
  }

  // payment_name байвал ашиглах
  if (payment.payment_name) {
    return payment.payment_name;
  }

  return paidBy || "QPay";
}
