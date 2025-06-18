import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // S3 URL 검증
    if (!url.startsWith('https://tennyvoice.s3.ap-northeast-2.amazonaws.com/')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const response = await fetch(url)
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch audio' }, { status: response.status })
    }

    const audioBuffer = await response.arrayBuffer()
    
    // 적절한 헤더와 함께 오디오 데이터 반환
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
      },
    })
  } catch (error) {
    console.error('오디오 프록시 에러:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 