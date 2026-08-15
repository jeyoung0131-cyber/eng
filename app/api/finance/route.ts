import { NextResponse } from 'next/server'

const KV_KEY = 'finance_global_data_v1'

function getKvConfig() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.STORAGE_REST_API_URL ||
    process.env.REST_API_URL

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.REST_API_TOKEN

  return { url, token }
}

export async function GET() {
  const { url, token } = getKvConfig()

  if (!url || !token) {
    return NextResponse.json({ error: 'DB 설정이 없습니다.' }, { status: 500 })
  }

  try {
    const res = await fetch(`${url}/get/${KV_KEY}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    const data = await res.json()
    if (!data || data.result === null || data.result === undefined) {
      return NextResponse.json({})
    }

    let parsed = data.result
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed)
      } catch (e) {
        // 이미 파싱되어 있거나 형식이 다른 경우
      }
    }

    return NextResponse.json(parsed || {}, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { url, token } = getKvConfig()

  if (!url || !token) {
    return NextResponse.json({ error: 'DB 설정이 없습니다.' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const stringifiedBody = JSON.stringify(body)

    // Upstash REST API POST set endpoint
    const res = await fetch(`${url}/set/${KV_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: stringifiedBody,
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'DB Save Failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}
