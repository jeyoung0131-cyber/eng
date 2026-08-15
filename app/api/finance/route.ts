import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

const KV_KEY = 'finance_global_data_v1'

export async function GET() {
  try {
    const data = await kv.get(KV_KEY)
    return NextResponse.json(data || {})
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await kv.set(KV_KEY, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}
