import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: Request) {
  try {
    const { userId, authorizationCode, state } = await request.json()

    if (!userId || !authorizationCode) {
      return NextResponse.json(
        { error: '사용자 ID와 인증 코드가 필요합니다.' },
        { status: 400 }
      )
    }

    // 네이버 토큰 요청
    const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code: authorizationCode,
        state: state || 'random_state',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('네이버 토큰 요청에 실패했습니다.')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // MongoDB에 토큰 저장
    const client = await clientPromise
    const db = client.db('ONAIR')
    
    const result = await db.collection('USER').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: {
          USER_NAVERTOKEN: accessToken,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: '네이버 계정이 성공적으로 연동되었습니다.' 
    })

  } catch (error) {
    //console.error('네이버 연동 오류:', error)
    return NextResponse.json(
      { error: '네이버 연동에 실패했습니다.' },
      { status: 500 }
    )
  }
} 