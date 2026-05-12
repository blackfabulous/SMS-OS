'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  FileText, Receipt, CreditCard, Banknote, Printer, Download,
  Settings, Eye, Palette, Stamp, Signature, School, Shield,
  CheckCircle2, Phone, Mail, MapPin, Globe, Calendar, User,
  Building2, Hash, DollarSign, FileSignature, Scale, Landmark,
  Percent, Briefcase, BadgeDollarSign, Clock, Copy,
} from 'lucide-react'

// ─── Template Settings State ──────────────────────────────────────────────────
interface TemplateSettings {
  schoolName: string
  schoolMotto: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  schoolWebsite: string
  primaryColor: string
  fontSize: 'small' | 'medium' | 'large'
  showWatermark: boolean
  showStamp: boolean
  showSignature: boolean
  paymentTerms: string
  bankName: string
  bankAccount: string
  bankBranch: string
  bankSwift: string
  currency: string
}

const defaultSettings: TemplateSettings = {
  schoolName: 'Mufakose High School',
  schoolMotto: 'Knowledge is Power — Ruzivo Simba',
  schoolAddress: '45 Mhondoro Road, Mufakose, Harare, Zimbabwe',
  schoolPhone: '+263 4 662 789',
  schoolEmail: 'info@mufakosehigh.co.zw',
  schoolWebsite: 'www.mufakosehigh.co.zw',
  primaryColor: '#059669',
  fontSize: 'medium',
  showWatermark: true,
  showStamp: true,
  showSignature: true,
  paymentTerms: 'Payment is due within 30 days of invoice date. Late payments may incur a 5% surcharge per month.',
  bankName: 'CBZ Bank Limited',
  bankAccount: '021-235-879-450',
  bankBranch: 'Mufakose Branch',
  bankSwift: 'COBZZWHa',
  currency: 'USD',
}

// ─── School Header Component ──────────────────────────────────────────────────
function SchoolHeader({ settings, type, documentNo }: {
  settings: TemplateSettings
  type: string
  documentNo: string
}) {
  return (
    <div className="relative mb-6">
      {/* Top accent line */}
      <div
        className="h-2 rounded-t-sm"
        style={{ backgroundColor: settings.primaryColor }}
      />
      <div className="border border-border/60 border-t-0 rounded-b-sm p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Logo Placeholder */}
            <div
              className="flex h-20 w-20 items-center justify-center rounded-xl border-2 text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: settings.primaryColor, borderColor: settings.primaryColor }}
            >
              <div className="text-center">
                <School className="h-8 w-8 mx-auto" />
                <span className="text-[8px] block mt-0.5 opacity-80">LOGO</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: settings.primaryColor }}>
                {settings.schoolName}
              </h1>
              <p className="text-xs italic text-muted-foreground mt-0.5">{settings.schoolMotto}</p>
              <Separator className="my-2 opacity-40" />
              <div className="grid grid-cols-1 gap-0.5 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" />{settings.schoolAddress}</div>
                <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{settings.schoolPhone}</div>
                <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" />{settings.schoolEmail}</div>
                <div className="flex items-center gap-1.5"><Globe className="h-3 w-3 shrink-0" />{settings.schoolWebsite}</div>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <Badge
              className="text-xs font-bold px-3 py-1"
              style={{ backgroundColor: settings.primaryColor, color: '#fff' }}
            >
              {type}
            </Badge>
            <p className="text-xs font-mono text-muted-foreground mt-2">{documentNo}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Watermark Overlay ────────────────────────────────────────────────────────
function WatermarkOverlay({ show, schoolName }: { show: boolean; schoolName: string }) {
  if (!show) return null
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="text-6xl font-black opacity-[0.03] -rotate-45 select-none whitespace-nowrap"
        style={{ color: '#059669' }}>
        {schoolName}
      </div>
    </div>
  )
}

// ─── Stamp Area ───────────────────────────────────────────────────────────────
function StampArea({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="flex items-center justify-center mt-6">
      <div className="w-28 h-28 rounded-full border-[3px] border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-center relative">
        <div className="absolute inset-1 rounded-full border border-muted-foreground/10" />
        <Stamp className="h-6 w-6 text-muted-foreground/25 mb-0.5" />
        <span className="text-[7px] font-bold text-muted-foreground/30 uppercase tracking-wider">Official</span>
        <span className="text-[7px] font-bold text-muted-foreground/30 uppercase tracking-wider">Stamp</span>
      </div>
    </div>
  )
}

// ─── Signature Line ───────────────────────────────────────────────────────────
function SignatureLine({ label, show }: { label: string; show: boolean }) {
  if (!show) return null
  return (
    <div className="text-center min-w-[180px]">
      <div className="border-b border-muted-foreground/40 mb-1.5 w-full" style={{ minHeight: '40px' }} />
      <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
      <p className="text-[9px] text-muted-foreground/60">Date: _______________</p>
    </div>
  )
}

// ─── INVOICE TEMPLATE ─────────────────────────────────────────────────────────
function InvoiceTemplate({ settings }: { settings: TemplateSettings }) {
  const [invoiceData] = useState({
    invoiceNo: 'INV-2024-001',
    date: '15 March 2024',
    dueDate: '15 April 2024',
    studentName: 'Tendai Moyo',
    studentNumber: 'MHS-2024-0342',
    class: 'Form 3A',
    parentGuardian: 'Mrs. R. Moyo',
    parentPhone: '+263 77 234 5678',
    items: [
      { desc: 'Tuition Fee — Term 1, 2024', qty: 1, unitPrice: 450.00 },
      { desc: 'Examination Fee — Mid-Term', qty: 1, unitPrice: 35.00 },
      { desc: 'Laboratory Fee — Science Practical', qty: 1, unitPrice: 25.00 },
      { desc: 'Library Fee — Annual', qty: 1, unitPrice: 15.00 },
      { desc: 'Technology Fee — Computer Lab', qty: 1, unitPrice: 30.00 },
      { desc: 'Sports & Cultural Fee', qty: 1, unitPrice: 20.00 },
    ],
    discount: 50.00,
  })

  const subtotal = invoiceData.items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const total = subtotal - invoiceData.discount

  return (
    <div className="relative bg-white dark:bg-white text-black print:text-black print:bg-white rounded-lg shadow-lg overflow-hidden" style={{ fontSize: settings.fontSize === 'small' ? '12px' : settings.fontSize === 'large' ? '16px' : '14px' }}>
      <WatermarkOverlay show={settings.showWatermark} schoolName={settings.schoolName} />
      <div className="relative p-8">
        <SchoolHeader settings={settings} type="INVOICE" documentNo={invoiceData.invoiceNo} />

        {/* Invoice Meta */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: settings.primaryColor }}>Bill To</h3>
            <div className="border border-border/30 rounded-md p-3">
              <p className="font-semibold text-sm">{invoiceData.studentName}</p>
              <p className="text-xs text-gray-500">Student No: {invoiceData.studentNumber}</p>
              <p className="text-xs text-gray-500">Class: {invoiceData.class}</p>
              <Separator className="my-2 opacity-30" />
              <p className="text-xs text-gray-500">Parent/Guardian: {invoiceData.parentGuardian}</p>
              <p className="text-xs text-gray-500">Phone: {invoiceData.parentPhone}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: settings.primaryColor }}>Invoice Details</h3>
            <div className="border border-border/30 rounded-md p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Invoice Number:</span>
                <span className="font-mono font-semibold">{invoiceData.invoiceNo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Date Issued:</span>
                <span className="font-medium">{invoiceData.date}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Due Date:</span>
                <span className="font-semibold text-red-600">{invoiceData.dueDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Currency:</span>
                <span className="font-medium">{settings.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 text-xs">
          <thead>
            <tr style={{ backgroundColor: settings.primaryColor }} className="text-white">
              <th className="py-2.5 px-3 text-left font-semibold rounded-tl-md">#</th>
              <th className="py-2.5 px-3 text-left font-semibold">Description</th>
              <th className="py-2.5 px-3 text-center font-semibold">Qty</th>
              <th className="py-2.5 px-3 text-right font-semibold">Unit Price</th>
              <th className="py-2.5 px-3 text-right font-semibold rounded-tr-md">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100 even:bg-gray-50/50">
                <td className="py-2.5 px-3 text-gray-500">{i + 1}</td>
                <td className="py-2.5 px-3 font-medium">{item.desc}</td>
                <td className="py-2.5 px-3 text-center">{item.qty}</td>
                <td className="py-2.5 px-3 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold">${(item.qty * item.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-72">
            <div className="flex justify-between py-1.5 text-xs">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-xs">
              <span className="text-gray-500">Discount (Sibling):</span>
              <span className="font-mono text-red-600">-${invoiceData.discount.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between py-2 text-sm font-bold rounded-md px-3" style={{ backgroundColor: settings.primaryColor + '15', color: settings.primaryColor }}>
              <span>Total Due:</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="bg-gray-50 rounded-md p-3 mb-6 border border-gray-100">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: settings.primaryColor }}>Payment Terms</h4>
          <p className="text-[10px] text-gray-500 leading-relaxed">{settings.paymentTerms}</p>
        </div>

        {/* Bank Details */}
        <div className="bg-gray-50 rounded-md p-3 mb-6 border border-gray-100">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: settings.primaryColor }}>Banking Details</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[10px] text-gray-600">
            <div><span className="text-gray-400">Bank:</span> {settings.bankName}</div>
            <div><span className="text-gray-400">Branch:</span> {settings.bankBranch}</div>
            <div><span className="text-gray-400">Account:</span> {settings.bankAccount}</div>
            <div><span className="text-gray-400">SWIFT:</span> {settings.bankSwift}</div>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-8">
          <SignatureLine label="Bursar — Authorized Signatory" show={settings.showSignature} />
          <StampArea show={settings.showStamp} />
          <SignatureLine label="Parent/Guardian Acknowledgment" show={settings.showSignature} />
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t text-center">
          <p className="text-[9px] text-gray-400">This is an official document of {settings.schoolName}. Generated by ZimSchool Pro.</p>
        </div>
      </div>
    </div>
  )
}

// ─── RECEIPT TEMPLATE ─────────────────────────────────────────────────────────
function ReceiptTemplate({ settings }: { settings: TemplateSettings }) {
  const [receiptData] = useState({
    receiptNo: 'RCT-2024-015',
    date: '20 March 2024',
    time: '09:45 AM',
    paymentMethod: 'Cash',
    referenceNo: '—',
    studentName: 'Tendai Moyo',
    studentNumber: 'MHS-2024-0342',
    class: 'Form 3A',
    parentGuardian: 'Mrs. R. Moyo',
    amount: 350.00,
    amountWords: 'Three Hundred and Fifty United States Dollars',
    allocations: [
      { desc: 'Tuition Fee — Term 1', amount: 280.00 },
      { desc: 'Examination Fee', amount: 35.00 },
      { desc: 'Sports & Cultural Fee', amount: 20.00 },
      { desc: 'Technology Fee', amount: 15.00 },
    ],
    balance: 125.00,
  })

  return (
    <div className="relative bg-white dark:bg-white text-black print:text-black print:bg-white rounded-lg shadow-lg overflow-hidden" style={{ fontSize: settings.fontSize === 'small' ? '12px' : settings.fontSize === 'large' ? '16px' : '14px' }}>
      <WatermarkOverlay show={settings.showWatermark} schoolName={settings.schoolName} />
      <div className="relative p-8">
        <SchoolHeader settings={settings} type="RECEIPT" documentNo={receiptData.receiptNo} />

        {/* Receipt Meta Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-border/30 rounded-md p-3 space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: settings.primaryColor }}>Received From</h3>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{receiptData.studentName}</p>
              <p className="text-gray-500">Student No: {receiptData.studentNumber}</p>
              <p className="text-gray-500">Class: {receiptData.class}</p>
              <p className="text-gray-500">Parent/Guardian: {receiptData.parentGuardian}</p>
            </div>
          </div>
          <div className="border border-border/30 rounded-md p-3 space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: settings.primaryColor }}>Payment Details</h3>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt No:</span>
                <span className="font-mono font-semibold">{receiptData.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium">{receiptData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span>{receiptData.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Method:</span>
                <Badge className="text-[9px] h-5" style={{ backgroundColor: settings.primaryColor + '20', color: settings.primaryColor }}>{receiptData.paymentMethod}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference:</span>
                <span className="font-mono">{receiptData.referenceNo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Box - Prominent */}
        <div className="border-2 rounded-lg p-4 mb-6 text-center" style={{ borderColor: settings.primaryColor }}>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Amount Received</p>
          <p className="text-4xl font-black font-mono" style={{ color: settings.primaryColor }}>
            ${receiptData.amount.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-500 italic mt-1">{receiptData.amountWords}</p>
        </div>

        {/* Allocations Table */}
        <table className="w-full mb-6 text-xs">
          <thead>
            <tr style={{ backgroundColor: settings.primaryColor }} className="text-white">
              <th className="py-2.5 px-3 text-left font-semibold rounded-tl-md">#</th>
              <th className="py-2.5 px-3 text-left font-semibold">Fee Allocation</th>
              <th className="py-2.5 px-3 text-right font-semibold rounded-tr-md">Amount</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.allocations.map((item, i) => (
              <tr key={i} className="border-b border-gray-100 even:bg-gray-50/50">
                <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                <td className="py-2 px-3 font-medium">{item.desc}</td>
                <td className="py-2 px-3 text-right font-mono">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2" style={{ borderColor: settings.primaryColor }}>
              <td className="py-2 px-3 font-bold" colSpan={2}>Total Payment</td>
              <td className="py-2 px-3 text-right font-mono font-bold" style={{ color: settings.primaryColor }}>
                ${receiptData.amount.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Balance */}
        <div className="flex justify-between items-center bg-gray-50 rounded-md p-3 mb-6 border border-gray-100">
          <span className="text-xs text-gray-500">Outstanding Balance:</span>
          <span className="font-mono font-bold text-sm text-red-600">${receiptData.balance.toFixed(2)}</span>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-8">
          <SignatureLine label="Received By — School Bursar" show={settings.showSignature} />
          <StampArea show={settings.showStamp} />
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t text-center">
          <p className="text-[9px] text-gray-400">This is an official receipt of {settings.schoolName}. Generated by ZimSchool Pro.</p>
          <p className="text-[9px] text-gray-400 mt-0.5">Please retain this receipt for your records. Duplicate issued on request.</p>
        </div>
      </div>
    </div>
  )
}

// ─── STUDENT STATEMENT TEMPLATE ───────────────────────────────────────────────
function StatementTemplate({ settings }: { settings: TemplateSettings }) {
  const [stmtData] = useState({
    statementNo: 'STMT-2024-047',
    period: '1 January 2024 — 15 March 2024',
    generatedDate: '15 March 2024',
    studentName: 'Chido Ndlovu',
    studentNumber: 'MHS-2024-0218',
    class: 'Form 2B',
    parentGuardian: 'Mr. J. Ndlovu',
    openingBalance: 175.00,
    transactions: [
      { date: '10 Jan 2024', ref: 'INV-2024-001', desc: 'Tuition Fee — Term 1', debit: 450.00, credit: 0, balance: 625.00 },
      { date: '10 Jan 2024', ref: 'INV-2024-001', desc: 'Examination Fee', debit: 35.00, credit: 0, balance: 660.00 },
      { date: '10 Jan 2024', ref: 'INV-2024-001', desc: 'Laboratory Fee', debit: 25.00, credit: 0, balance: 685.00 },
      { date: '25 Jan 2024', ref: 'RCT-2024-005', desc: 'Cash Payment — Term 1', debit: 0, credit: 300.00, balance: 385.00 },
      { date: '15 Feb 2024', ref: 'RCT-2024-012', desc: 'EcoCash Payment — Partial', debit: 0, credit: 150.00, balance: 235.00 },
      { date: '01 Mar 2024', ref: 'INV-2024-008', desc: 'Sports & Cultural Fee', debit: 20.00, credit: 0, balance: 255.00 },
      { date: '10 Mar 2024', ref: 'RCT-2024-015', desc: 'Cash Payment', debit: 0, credit: 100.00, balance: 155.00 },
    ],
    closingBalance: 155.00,
    aging: [
      { period: 'Current', amount: 20.00 },
      { period: '30 Days', amount: 35.00 },
      { period: '60 Days', amount: 50.00 },
      { period: '90+ Days', amount: 50.00 },
    ],
  })

  const totalDebits = stmtData.transactions.reduce((s, t) => s + t.debit, 0)
  const totalCredits = stmtData.transactions.reduce((s, t) => s + t.credit, 0)

  return (
    <div className="relative bg-white dark:bg-white text-black print:text-black print:bg-white rounded-lg shadow-lg overflow-hidden" style={{ fontSize: settings.fontSize === 'small' ? '12px' : settings.fontSize === 'large' ? '16px' : '14px' }}>
      <WatermarkOverlay show={settings.showWatermark} schoolName={settings.schoolName} />
      <div className="relative p-8">
        <SchoolHeader settings={settings} type="STATEMENT" documentNo={stmtData.statementNo} />

        {/* Student & Statement Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-border/30 rounded-md p-3">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: settings.primaryColor }}>Student Details</h3>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{stmtData.studentName}</p>
              <p className="text-gray-500">Student No: {stmtData.studentNumber}</p>
              <p className="text-gray-500">Class: {stmtData.class}</p>
              <p className="text-gray-500">Parent/Guardian: {stmtData.parentGuardian}</p>
            </div>
          </div>
          <div className="border border-border/30 rounded-md p-3 space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: settings.primaryColor }}>Statement Details</h3>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Period:</span>
                <span className="font-medium text-right" style={{ maxWidth: '180px' }}>{stmtData.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Generated:</span>
                <span>{stmtData.generatedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Opening Balance:</span>
                <span className="font-mono">${stmtData.openingBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-red-50 rounded-md p-3 border border-red-100 text-center">
            <p className="text-[10px] uppercase tracking-wider text-red-500">Total Invoiced</p>
            <p className="text-lg font-bold font-mono text-red-600">${totalDebits.toFixed(2)}</p>
          </div>
          <div className="bg-emerald-50 rounded-md p-3 border border-emerald-100 text-center">
            <p className="text-[10px] uppercase tracking-wider text-emerald-600">Total Paid</p>
            <p className="text-lg font-bold font-mono text-emerald-600">${totalCredits.toFixed(2)}</p>
          </div>
          <div className="bg-amber-50 rounded-md p-3 border border-amber-100 text-center">
            <p className="text-[10px] uppercase tracking-wider text-amber-600">Balance Due</p>
            <p className="text-lg font-bold font-mono text-amber-700">${stmtData.closingBalance.toFixed(2)}</p>
          </div>
        </div>

        {/* Transaction History */}
        <table className="w-full mb-6 text-xs">
          <thead>
            <tr style={{ backgroundColor: settings.primaryColor }} className="text-white">
              <th className="py-2.5 px-2 text-left font-semibold rounded-tl-md">Date</th>
              <th className="py-2.5 px-2 text-left font-semibold">Reference</th>
              <th className="py-2.5 px-2 text-left font-semibold">Description</th>
              <th className="py-2.5 px-2 text-right font-semibold">Debit</th>
              <th className="py-2.5 px-2 text-right font-semibold">Credit</th>
              <th className="py-2.5 px-2 text-right font-semibold rounded-tr-md">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200 bg-gray-50">
              <td className="py-2 px-2" colSpan={5}><span className="font-medium text-gray-500">Opening Balance</span></td>
              <td className="py-2 px-2 text-right font-mono font-semibold">${stmtData.openingBalance.toFixed(2)}</td>
            </tr>
            {stmtData.transactions.map((tx, i) => (
              <tr key={i} className="border-b border-gray-100 even:bg-gray-50/50">
                <td className="py-2 px-2 text-gray-500 whitespace-nowrap">{tx.date}</td>
                <td className="py-2 px-2 font-mono text-gray-500">{tx.ref}</td>
                <td className="py-2 px-2 font-medium">{tx.desc}</td>
                <td className="py-2 px-2 text-right font-mono">{tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : ''}</td>
                <td className="py-2 px-2 text-right font-mono text-emerald-600">{tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : ''}</td>
                <td className="py-2 px-2 text-right font-mono font-semibold">${tx.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 font-bold" style={{ borderColor: settings.primaryColor }}>
              <td className="py-2 px-2" colSpan={3}>Totals</td>
              <td className="py-2 px-2 text-right font-mono">${totalDebits.toFixed(2)}</td>
              <td className="py-2 px-2 text-right font-mono text-emerald-600">${totalCredits.toFixed(2)}</td>
              <td className="py-2 px-2 text-right font-mono" style={{ color: settings.primaryColor }}>${stmtData.closingBalance.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Aging Analysis */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: settings.primaryColor }}>Aging Analysis</h3>
          <div className="grid grid-cols-4 gap-2">
            {stmtData.aging.map((a) => (
              <div key={a.period} className="border border-border/30 rounded-md p-2.5 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{a.period}</p>
                <p className="text-sm font-bold font-mono">${a.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-8">
          <SignatureLine label="Bursar — Authorized Signatory" show={settings.showSignature} />
          <StampArea show={settings.showStamp} />
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t text-center">
          <p className="text-[9px] text-gray-400">This is an official statement of {settings.schoolName}. Generated by ZimSchool Pro.</p>
          <p className="text-[9px] text-gray-400 mt-0.5">Please report any discrepancies within 14 days of statement date.</p>
        </div>
      </div>
    </div>
  )
}

// ─── PAYSLIP TEMPLATE ─────────────────────────────────────────────────────────
function PayslipTemplate({ settings }: { settings: TemplateSettings }) {
  const [payslipData] = useState(() => {
    const basicSalary = 1200.00
    const housingAllowance = 200.00
    const transportAllowance = 150.00
    const ruralAllowance = 50.00
    const totalEarnings = basicSalary + housingAllowance + transportAllowance + ruralAllowance

    // Zimbabwe Statutory Deductions
    const taxableIncome = totalEarnings - 250.00 // NSSA exempt portion simplified

    // PAYE Calculation (2024 Zimbabwe tax bands)
    let paye = 0
    if (taxableIncome > 0) {
      const bands = [
        { limit: 1000, rate: 0 },
        { limit: 1500, rate: 0.20 },
        { limit: 3000, rate: 0.25 },
        { limit: 5000, rate: 0.30 },
        { limit: 10000, rate: 0.35 },
        { limit: Infinity, rate: 0.40 },
      ]
      let remaining = taxableIncome
      let prevLimit = 0
      for (const band of bands) {
        const taxableInBand = Math.min(remaining, band.limit - prevLimit)
        paye += taxableInBand * band.rate
        remaining -= taxableInBand
        prevLimit = band.limit
        if (remaining <= 0) break
      }
    }

    // NSSA: 4.5% employee contribution (on basic salary up to cap)
    const nssaEmployee = Math.min(basicSalary * 0.045, 81.00) // capped
    // AIDS Levy: 3% of PAYE
    const aidsLevy = paye * 0.03
    // ZIMDEF: 1% employer only
    const zimdefEmployer = basicSalary * 0.01
    // Pension
    const pensionEmployee = basicSalary * 0.05
    // Medical Aid
    const medicalAidEmployee = 45.00

    const totalDeductions = paye + nssaEmployee + aidsLevy + pensionEmployee + medicalAidEmployee
    const netPay = totalEarnings - totalDeductions

    // Employer contributions
    const nssaEmployer = Math.min(basicSalary * 0.045, 81.00)
    const pensionEmployer = basicSalary * 0.07
    const medicalAidEmployer = 45.00
    const totalEmployerContrib = nssaEmployer + pensionEmployer + medicalAidEmployer + zimdefEmployer

    return {
      employeeName: 'Mr. T. Moyo',
      staffNumber: 'MHS-STF-014',
      position: 'Teacher',
      department: 'Academics — Science Department',
      payPeriod: 'March 2024',
      payDate: '28 March 2024',
      dateOfJoin: '01 September 2015',
      taxNumber: 'BRN-0234567A',
      nssaNumber: 'NSSA-0458921',
      bankAccount: '021-XXX-XXX-456',
      earnings: [
        { desc: 'Basic Salary', amount: basicSalary },
        { desc: 'Housing Allowance', amount: housingAllowance },
        { desc: 'Transport Allowance', amount: transportAllowance },
        { desc: 'Rural/Hardship Allowance', amount: ruralAllowance },
      ],
      deductions: [
        { desc: 'PAYE (Income Tax)', amount: paye },
        { desc: 'NSSA (4.5% Employee)', amount: nssaEmployee },
        { desc: 'AIDS Levy (3% of PAYE)', amount: aidsLevy },
        { desc: 'Pension (5% Employee)', amount: pensionEmployee },
        { desc: 'Medical Aid — CIMAS', amount: medicalAidEmployee },
      ],
      totalEarnings,
      totalDeductions,
      netPay,
      employerContributions: [
        { desc: 'NSSA (4.5% Employer)', amount: nssaEmployer },
        { desc: 'Pension (7% Employer)', amount: pensionEmployer },
        { desc: 'Medical Aid — CIMAS', amount: medicalAidEmployer },
        { desc: 'ZIMDEF (1% Employer)', amount: zimdefEmployer },
      ],
      totalEmployerContrib,
      netPayWords: 'One Thousand, Two Hundred and Eighty-Seven United States Dollars and Thirty-Four Cents',
    }
  })

  return (
    <div className="relative bg-white dark:bg-white text-black print:text-black print:bg-white rounded-lg shadow-lg overflow-hidden" style={{ fontSize: settings.fontSize === 'small' ? '12px' : settings.fontSize === 'large' ? '16px' : '14px' }}>
      <WatermarkOverlay show={settings.showWatermark} schoolName={settings.schoolName} />
      <div className="relative p-8">
        <SchoolHeader settings={settings} type="PAYSLIP" documentNo={`PAY-${payslipData.staffNumber}-${payslipData.payPeriod.replace(' ', '-')}`} />

        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-border/30 rounded-md p-3">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: settings.primaryColor }}>Employee Details</h3>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-sm">{payslipData.employeeName}</p>
              <p className="text-gray-500">Staff No: {payslipData.staffNumber}</p>
              <p className="text-gray-500">Position: {payslipData.position}</p>
              <p className="text-gray-500">Department: {payslipData.department}</p>
              <p className="text-gray-500">Date of Joining: {payslipData.dateOfJoin}</p>
            </div>
          </div>
          <div className="border border-border/30 rounded-md p-3 space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: settings.primaryColor }}>Pay Details</h3>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Pay Period:</span>
                <span className="font-semibold">{payslipData.payPeriod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pay Date:</span>
                <span>{payslipData.payDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax Number:</span>
                <span className="font-mono">{payslipData.taxNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">NSSA Number:</span>
                <span className="font-mono">{payslipData.nssaNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bank Account:</span>
                <span className="font-mono">{payslipData.bankAccount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions Side by Side */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Earnings */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: settings.primaryColor }}>
              <DollarSign className="h-3.5 w-3.5" /> Earnings
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: settings.primaryColor + '15' }}>
                  <th className="py-2 px-2 text-left font-semibold rounded-tl-md" style={{ color: settings.primaryColor }}>Description</th>
                  <th className="py-2 px-2 text-right font-semibold rounded-tr-md" style={{ color: settings.primaryColor }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payslipData.earnings.map((e, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-2">{e.desc}</td>
                    <td className="py-2 px-2 text-right font-mono">${e.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2" style={{ borderColor: settings.primaryColor }}>
                  <td className="py-2 px-2 font-bold">Total Earnings</td>
                  <td className="py-2 px-2 text-right font-mono font-bold" style={{ color: settings.primaryColor }}>
                    ${payslipData.totalEarnings.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-red-600">
              <Percent className="h-3.5 w-3.5" /> Deductions
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-red-50">
                  <th className="py-2 px-2 text-left font-semibold rounded-tl-md text-red-600">Description</th>
                  <th className="py-2 px-2 text-right font-semibold rounded-tr-md text-red-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payslipData.deductions.map((d, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-2">{d.desc}</td>
                    <td className="py-2 px-2 text-right font-mono text-red-600">-${d.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-red-300">
                  <td className="py-2 px-2 font-bold text-red-600">Total Deductions</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-red-600">
                    -${payslipData.totalDeductions.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* NET PAY - Prominent */}
        <div className="border-2 rounded-lg p-5 mb-6 text-center" style={{ borderColor: settings.primaryColor, backgroundColor: settings.primaryColor + '08' }}>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Net Pay</p>
          <p className="text-4xl font-black font-mono" style={{ color: settings.primaryColor }}>
            ${payslipData.netPay.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-500 italic mt-1.5 max-w-md mx-auto">{payslipData.netPayWords}</p>
        </div>

        {/* Employer Contributions */}
        <div className="mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: settings.primaryColor }}>
            <Building2 className="h-3.5 w-3.5" /> Employer Contributions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <table className="w-full text-xs">
              <tbody>
                {payslipData.employerContributions.map((c, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1.5 px-2 text-gray-600">{c.desc}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-gray-500">${c.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="py-1.5 px-2">Total Employer Cost</td>
                  <td className="py-1.5 px-2 text-right font-mono">${payslipData.totalEmployerContrib.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="bg-gray-50 rounded-md p-3 border border-gray-100 text-[10px] text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700 text-xs">Statutory Notes:</p>
              <p>• PAYE calculated per ZIMRA 2024 tax bands</p>
              <p>• NSSA capped at maximum insurable earnings</p>
              <p>• AIDS Levy is 3% of PAYE amount</p>
              <p>• ZIMDEF is 1% of basic salary (employer only)</p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-8">
          <SignatureLine label="Headmaster — Authorized Signatory" show={settings.showSignature} />
          <SignatureLine label="Employee Acknowledgment" show={settings.showSignature} />
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t text-center">
          <p className="text-[9px] text-gray-400">This is a computer-generated payslip of {settings.schoolName}. Generated by ZimSchool Pro.</p>
          <p className="text-[9px] text-gray-400 mt-0.5">This payslip is confidential. If not the intended recipient, please destroy it.</p>
        </div>
      </div>
    </div>
  )
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab({ settings, onSettingsChange }: {
  settings: TemplateSettings
  onSettingsChange: (s: TemplateSettings) => void
}) {
  const update = (key: keyof TemplateSettings, value: string | boolean) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* School Branding */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <School className="h-4 w-4 text-emerald-600" />
            School Branding
          </CardTitle>
          <CardDescription>Customize the header shown on all print templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload Area */}
          <div>
            <Label className="text-xs">School Logo</Label>
            <div className="mt-1.5 flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors">
                <School className="h-8 w-8 text-emerald-400" />
                <span className="text-[8px] text-emerald-500 mt-0.5">Upload</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Upload your school logo (PNG, JPG)</p>
                <p className="text-[10px]">Recommended: 200×200px, transparent background</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">School Name</Label>
              <Input value={settings.schoolName} onChange={e => update('schoolName', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">School Motto</Label>
              <Input value={settings.schoolMotto} onChange={e => update('schoolMotto', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Address</Label>
            <Input value={settings.schoolAddress} onChange={e => update('schoolAddress', e.target.value)} className="mt-1 h-8 text-xs" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={settings.schoolPhone} onChange={e => update('schoolPhone', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={settings.schoolEmail} onChange={e => update('schoolEmail', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Website</Label>
              <Input value={settings.schoolWebsite} onChange={e => update('schoolWebsite', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4 text-emerald-600" />
            Template Appearance
          </CardTitle>
          <CardDescription>Control the visual style of printed documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={e => update('primaryColor', e.target.value)}
                  className="h-8 w-10 rounded cursor-pointer border"
                />
                <Input value={settings.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="h-8 text-xs font-mono" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Font Size</Label>
              <Select value={settings.fontSize} onValueChange={v => update('fontSize', v)}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (12px)</SelectItem>
                  <SelectItem value="medium">Medium (14px)</SelectItem>
                  <SelectItem value="large">Large (16px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs">Show Watermark</Label>
              </div>
              <Switch checked={settings.showWatermark} onCheckedChange={v => update('showWatermark', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stamp className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs">Show Stamp Area</Label>
              </div>
              <Switch checked={settings.showStamp} onCheckedChange={v => update('showStamp', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signature className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs">Show Signature Lines</Label>
              </div>
              <Switch checked={settings.showSignature} onCheckedChange={v => update('showSignature', v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment & Banking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Landmark className="h-4 w-4 text-emerald-600" />
            Payment & Banking Details
          </CardTitle>
          <CardDescription>Configure payment terms and bank details for invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Default Payment Terms</Label>
            <Textarea value={settings.paymentTerms} onChange={e => update('paymentTerms', e.target.value)} className="mt-1 text-xs min-h-[60px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Bank Name</Label>
              <Input value={settings.bankName} onChange={e => update('bankName', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Branch</Label>
              <Input value={settings.bankBranch} onChange={e => update('bankBranch', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Account Number</Label>
              <Input value={settings.bankAccount} onChange={e => update('bankAccount', e.target.value)} className="mt-1 h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-xs">SWIFT Code</Label>
              <Input value={settings.bankSwift} onChange={e => update('bankSwift', e.target.value)} className="mt-1 h-8 text-xs font-mono" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Currency</Label>
            <Select value={settings.currency} onValueChange={v => update('currency', v)}>
              <SelectTrigger className="mt-1 h-8 text-xs w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="ZiG">ZiG — Zimbabwe Gold</SelectItem>
                <SelectItem value="ZWL">ZWL — Zimbabwe Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── TEMPLATE PREVIEW WRAPPER ─────────────────────────────────────────────────
function TemplatePreviewWrapper({ children, title, settings }: {
  children: React.ReactNode
  title: string
  settings: TemplateSettings
}) {
  const handlePrint = () => {
    const printContent = document.getElementById('print-template-area')
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print')
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} — ${settings.schoolName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Georgia', 'Times New Roman', serif; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body onload="window.print(); window.close();">
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    toast.success(`Print dialog opened for ${title}`)
  }

  const handleDownloadPDF = () => {
    toast.info(`PDF download for "${title}" will use the print dialog. Choose "Save as PDF" in the print dialog.`)
    handlePrint()
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">
            <Eye className="h-3 w-3 mr-1" />
            Live Preview
          </Badge>
          <span className="text-xs text-muted-foreground">— {title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={handleDownloadPDF}>
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Template Preview */}
      <div id="print-template-area" className="overflow-auto">
        {children}
      </div>
    </div>
  )
}

// ─── MAIN MODULE ──────────────────────────────────────────────────────────────
export default function PremiumTemplatesModule() {
  const [settings, setSettings] = useState<TemplateSettings>(defaultSettings)
  const [activeTab, setActiveTab] = useState('invoices')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Premium Print Templates</h2>
          <p className="text-sm text-muted-foreground">Professional, print-ready documents for your school</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-xs">
            <FileText className="h-3 w-3 mr-1" />
            4 Templates
          </Badge>
        </div>
      </div>

      {/* Template Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:inline-flex h-10">
          <TabsTrigger value="invoices" className="text-xs gap-1.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-400">
            <FileText className="h-3.5 w-3.5 hidden sm:block" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="receipts" className="text-xs gap-1.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-400">
            <Receipt className="h-3.5 w-3.5 hidden sm:block" />
            Receipts
          </TabsTrigger>
          <TabsTrigger value="statements" className="text-xs gap-1.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-400">
            <CreditCard className="h-3.5 w-3.5 hidden sm:block" />
            Statements
          </TabsTrigger>
          <TabsTrigger value="payslips" className="text-xs gap-1.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-400">
            <Banknote className="h-3.5 w-3.5 hidden sm:block" />
            Payslips
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-400">
            <Settings className="h-3.5 w-3.5 hidden sm:block" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <TemplatePreviewWrapper title="Invoice Template" settings={settings}>
            <InvoiceTemplate settings={settings} />
          </TemplatePreviewWrapper>
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <TemplatePreviewWrapper title="Receipt Template" settings={settings}>
            <ReceiptTemplate settings={settings} />
          </TemplatePreviewWrapper>
        </TabsContent>

        <TabsContent value="statements" className="mt-4">
          <TemplatePreviewWrapper title="Student Statement Template" settings={settings}>
            <StatementTemplate settings={settings} />
          </TemplatePreviewWrapper>
        </TabsContent>

        <TabsContent value="payslips" className="mt-4">
          <TemplatePreviewWrapper title="Payslip Template" settings={settings}>
            <PayslipTemplate settings={settings} />
          </TemplatePreviewWrapper>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab settings={settings} onSettingsChange={setSettings} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
