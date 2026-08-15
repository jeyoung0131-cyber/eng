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
    console.error('DB Config Missing - URL/TOKEN missing')
    return NextResponse.json({ error: 'DB 설정이 없습니다.' }, { status: 500 })
  }

  try {
    const res = await fetch(`${url}/get/${KV_KEY}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const data = await res.json()
    if (!data.result) {
      return NextResponse.json({})
    }

    // Upstash는 객체를 문자열(JSON string) 형태나 바로 객체로 리턴하므로 안전하게 파싱
    const parsedData = typeof data.result === 'string' ? JSON.parse(data.result) : data.result
    return NextResponse.json(parsedData)
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { url, token } = getKvConfig()

  if (!url || !token) {
    console.error('DB Config Missing - URL/TOKEN missing')
    return NextResponse.json({ error: 'DB 설정이 없습니다.' }, { status: 500 })
  }

  try {
    const body = await request.json()

    // JSON.stringify로 변환하여 Upstash REST API 규격에 맞춰 저장
    const res = await fetch(`${url}/set/${KV_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(body)),
    })

    if (!res.ok) {
      throw new Error(`Upstash response error status: ${res.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}
