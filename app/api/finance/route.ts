import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const KV_KEY = 'finance_global_data_v1'

// Upstash / Vercel 환경변수 자동 할당
const redis = Redis.fromEnv()

export async function GET() {
  try {
    const data = await redis.get(KV_KEY)
    return NextResponse.json(data || {})
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await redis.set(KV_KEY, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}
