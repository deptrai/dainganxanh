'use client'

import { Printer } from 'lucide-react'

export function VoucherPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer print:hidden"
    >
      <Printer className="w-4 h-4" />
      In vé / Lưu PDF
    </button>
  )
}
