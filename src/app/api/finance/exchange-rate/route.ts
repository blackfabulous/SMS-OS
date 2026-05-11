import { NextResponse } from 'next/server'

// In-memory exchange rate storage (would be in DB in production)
let exchangeRate = {
  rate: 26.5,
  lastUpdated: new Date().toISOString(),
  source: 'Reserve Bank of Zimbabwe',
  updatedBy: 'System',
}

// GET /api/finance/exchange-rate - Get current USD/ZiG exchange rate
export async function GET() {
  return NextResponse.json({
    rate: exchangeRate.rate,
    lastUpdated: exchangeRate.lastUpdated,
    source: exchangeRate.source,
    updatedBy: exchangeRate.updatedBy,
    from: 'USD',
    to: 'ZiG',
    note: 'Exchange rate for Zimbabwe Gold (ZiG) against USD',
  })
}

// PUT /api/finance/exchange-rate - Update exchange rate (admin only)
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    if (!body.rate || typeof body.rate !== 'number' || body.rate <= 0) {
      return NextResponse.json(
        { error: 'Invalid rate. Must be a positive number.' },
        { status: 400 }
      )
    }

    exchangeRate = {
      rate: body.rate,
      lastUpdated: new Date().toISOString(),
      source: body.source || 'Manual Update',
      updatedBy: body.updatedBy || 'Admin',
    }

    return NextResponse.json({
      message: 'Exchange rate updated successfully',
      rate: exchangeRate.rate,
      lastUpdated: exchangeRate.lastUpdated,
      source: exchangeRate.source,
      updatedBy: exchangeRate.updatedBy,
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
