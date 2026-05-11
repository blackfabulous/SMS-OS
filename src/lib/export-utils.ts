/**
 * ZimSchool Pro - Export Utilities
 * Provides CSV export, print, and currency formatting functions
 */

/**
 * Converts an array of objects to CSV format and triggers a browser download
 */
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return

  // Get headers from the first object's keys
  const headers = Object.keys(data[0])

  // Build CSV rows
  const csvRows: string[] = []

  // Add header row
  csvRows.push(headers.map(escapeCSV).join(','))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      return escapeCSV(String(value))
    })
    csvRows.push(values.join(','))
  }

  const csvContent = csvRows.join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escapes a CSV field value (handles commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Opens a print dialog with formatted HTML content
 */
export function printReport(title: string, content: string) {
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    // Fallback: print current window
    window.print()
    return
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { margin: 1cm; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          color: #1a1a1a;
          line-height: 1.5;
          margin: 0;
          padding: 20px;
        }
        .report-header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #10b981;
        }
        .report-header h1 {
          font-size: 20px;
          color: #064e3b;
          margin: 0 0 4px 0;
        }
        .report-header p {
          color: #6b7280;
          margin: 0;
          font-size: 11px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 11px;
        }
        th {
          background-color: #ecfdf5;
          color: #064e3b;
          font-weight: 600;
          padding: 8px 10px;
          text-align: left;
          border-bottom: 2px solid #10b981;
        }
        td {
          padding: 6px 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) { background-color: #f9fafb; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-gray { background: #f3f4f6; color: #374151; }
        .footer {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 10px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>ZimSchool Pro</h1>
        <p>${title} — Generated on ${new Date().toLocaleDateString('en-ZW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      ${content}
      <div class="footer">
        ZimSchool Pro &mdash; School Management System &mdash; Confidential
      </div>
      <div class="no-print" style="text-align: center; margin-top: 16px;">
        <button onclick="window.print()" style="padding: 8px 24px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Print Report</button>
        <button onclick="window.close()" style="padding: 8px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-left: 8px;">Close</button>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  // Auto-trigger print dialog after a short delay
  setTimeout(() => {
    printWindow.print()
  }, 500)
}

/**
 * Formats a number as currency (USD or ZiG)
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'ZiG' || currency === 'ZWG') {
    return new Intl.NumberFormat('en-ZW', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' ZiG'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Builds an HTML table string from data for print reports
 */
export function buildHTMLTable(
  headers: string[],
  rows: string[][],
  options?: { striped?: boolean }
): string {
  const striped = options?.striped ?? true
  let html = '<table>'
  html += '<thead><tr>'
  for (const h of headers) {
    html += `<th>${h}</th>`
  }
  html += '</tr></thead><tbody>'
  for (let i = 0; i < rows.length; i++) {
    html += `<tr${striped && i % 2 === 1 ? ' style="background-color:#f9fafb"' : ''}>`
    for (const cell of rows[i]) {
      html += `<td>${cell}</td>`
    }
    html += '</tr>'
  }
  html += '</tbody></table>'
  return html
}
