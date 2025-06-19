import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: Request) {
  try {
    const { userId, authorizationCode } = await request.json()

    if (!userId || !authorizationCode) {
      return NextResponse.json(
        { error: '사용자 ID와 인증 코드가 필요합니다.' },
        { status: 400 }
      )
    }

    // 구글 토큰 요청
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code: authorizationCode,
        redirect_uri: `${process.env.NEXTAUTH_URL}api/auth/google/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('구글 토큰 요청에 실패했습니다.')
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
          USER_GOOGLETOKEN: accessToken,
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
      message: '구글 계정이 성공적으로 연동되었습니다.' 
    })

  } catch (error) {
    console.error('구글 연동 오류:', error)
    return NextResponse.json(
      { error: '구글 연동에 실패했습니다.' },
      { status: 500 }
    )
  }
} 