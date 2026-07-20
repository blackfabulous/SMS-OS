import { QrCode } from 'lucide-react'

export function QRCodePlaceholder() {
  return (
    <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20">
      <div className="text-center">
        <QrCode className="h-10 w-10 text-emerald-400 mx-auto mb-1" />
        <p className="text-[9px] text-emerald-600 font-medium">SCAN TO PAY</p>
      </div>
    </div>
  )
}
