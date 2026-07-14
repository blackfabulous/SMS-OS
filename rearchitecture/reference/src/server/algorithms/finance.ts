import Decimal from "decimal.js";

/**
 * Financial algorithms used by the Finance context.
 * All money is handled with Decimal.js to avoid floating-point errors.
 */

export interface MoneyAllocation {
  invoiceId: string;
  amount: Decimal;
}

export interface InvoiceSummary {
  id: string;
  totalAmount: Decimal;
  paidAmount: Decimal;
}

/**
 * Prorate an amount by days used.
 * Example: term fee = 500, used 15 of 90 days -> 83.33.
 */
export function prorate(amount: Decimal, daysUsed: number, totalDays: number): Decimal {
  if (totalDays <= 0 || daysUsed <= 0) return new Decimal("0");
  if (daysUsed >= totalDays) return amount;
  return amount.times(daysUsed).dividedBy(totalDays);
}

/**
 * Calculate the remaining balance of an invoice.
 */
export function invoiceBalance(invoiceTotal: Decimal, allocations: { amount: Decimal }[]): Decimal {
  const paid = allocations.reduce((sum, a) => sum.plus(a.amount), new Decimal("0"));
  return Decimal.max("0", invoiceTotal.minus(paid));
}

/**
 * Allocate a payment across a list of invoices using a FIFO strategy.
 * Invoices are paid in the order provided.
 */
export function allocatePayment(
  paymentAmount: Decimal,
  invoices: { id: string; balance: Decimal }[]
): MoneyAllocation[] {
  let remaining = paymentAmount;
  const allocations: MoneyAllocation[] = [];

  for (const invoice of invoices) {
    if (remaining.lessThanOrEqualTo("0")) break;

    const amount = Decimal.min(remaining, invoice.balance);
    if (amount.greaterThan("0")) {
      allocations.push({ invoiceId: invoice.id, amount });
      remaining = remaining.minus(amount);
    }
  }

  return allocations;
}

/**
 * Sum invoice totals and payments to produce balances.
 */
export function summarizeInvoices(
  invoices: { id: string; totalAmount: Decimal }[],
  allocations: { invoiceId: string; amount: Decimal }[]
): InvoiceSummary[] {
  const allocationMap = allocations.reduce<Record<string, Decimal>>((map, a) => {
    map[a.invoiceId] = (map[a.invoiceId] ?? new Decimal("0")).plus(a.amount);
    return map;
  }, {});

  return invoices.map((invoice) => ({
    id: invoice.id,
    totalAmount: invoice.totalAmount,
    paidAmount: allocationMap[invoice.id] ?? new Decimal("0"),
  }));
}

/**
 * Compute the due date from an issue date and payment terms in days.
 */
export function dueDate(issueDate: Date, termsDays: number): Date {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + termsDays);
  return date;
}

/**
 * Apply a late fee if a payment is past due.
 */
export function applyLateFee(
  outstandingBalance: Decimal,
  annualRate: Decimal,
  daysOverdue: number
): Decimal {
  if (daysOverdue <= 0 || outstandingBalance.lessThanOrEqualTo("0")) return new Decimal("0");
  const dailyRate = annualRate.dividedBy("365");
  return outstandingBalance.times(dailyRate).times(daysOverdue);
}
