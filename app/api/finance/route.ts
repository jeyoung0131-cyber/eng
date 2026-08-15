import { NextResponse } from 'next/server'

const KV_KEY = 'finance_global_data_v1'

// Vercel / Upstash 환경변수 자동 참조
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

export async function GET() {
  if (!KV_URL || !KV_TOKEN) {
    return NextResponse.json({ error: 'DB 설정이 없습니다.' }, { status: 500 })
  }

  try {
    const res = await fetch(`${KV_URL}/get/${KV_KEY}`, {
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
      },
      cache: 'no-store',
    })

    const data = await res.json()
    const parsedData = data.result ? JSON.parse(data.result) : {}
    return NextResponse.json(parsedData)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!KV_URL || !KV_TOKEN) {
    return NextResponse.json({ error: 'DB 설정이 없습니다.' }, { status: 500 })
  }

  try {
    const body = await request.json()
    
    await fetch(`${KV_URL}/set/${KV_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(body)),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}
