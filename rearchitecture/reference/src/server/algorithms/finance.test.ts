import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { prorate, invoiceBalance, allocatePayment, summarizeInvoices, dueDate, applyLateFee } from "./finance";

describe("finance algorithms", () => {
  it("prorates by days used", () => {
    const result = prorate(new Decimal("500"), 15, 90);
    expect(result.toFixed(2)).toBe("83.33");
  });

  it("returns full amount when days used exceeds total", () => {
    const result = prorate(new Decimal("500"), 100, 90);
    expect(result.toFixed(2)).toBe("500.00");
  });

  it("calculates invoice balance", () => {
    const balance = invoiceBalance(new Decimal("500"), [{ amount: new Decimal("200") }, { amount: new Decimal("50") }]);
    expect(balance.toFixed(2)).toBe("250.00");
  });

  it("does not return negative balance", () => {
    const balance = invoiceBalance(new Decimal("500"), [{ amount: new Decimal("600") }]);
    expect(balance.toFixed(2)).toBe("0.00");
  });

  it("allocates payment FIFO across invoices", () => {
    const invoices = [
      { id: "inv-1", balance: new Decimal("200") },
      { id: "inv-2", balance: new Decimal("300") },
      { id: "inv-3", balance: new Decimal("100") },
    ];
    const allocations = allocatePayment(new Decimal("400"), invoices);

    expect(allocations).toHaveLength(2);
    expect(allocations[0].amount.toFixed(2)).toBe("200.00");
    expect(allocations[1].amount.toFixed(2)).toBe("200.00");
  });

  it("summarizes invoices with payments", () => {
    const invoices = [{ id: "inv-1", totalAmount: new Decimal("500") }];
    const allocations = [{ invoiceId: "inv-1", amount: new Decimal("150") }];

    const summary = summarizeInvoices(invoices, allocations);
    expect(summary[0].paidAmount.toFixed(2)).toBe("150.00");
  });

  it("computes due date", () => {
    const issueDate = new Date("2025-01-15");
    const result = dueDate(issueDate, 30);
    expect(result.toISOString().startsWith("2025-02-14")).toBe(true);
  });

  it("computes late fee", () => {
    const fee = applyLateFee(new Decimal("500"), new Decimal("0.24"), 30);
    expect(fee.toFixed(2)).toBe("9.86");
  });
});
