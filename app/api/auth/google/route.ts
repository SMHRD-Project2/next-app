import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  console.log('[GOOGLE] 구글 콜백 시작')
  
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  console.log('[GOOGLE] 받은 파라미터:', { code: code?.substring(0, 10) + '...', state })

  if (!code) {
    console.error('[GOOGLE] Authorization code가 없습니다')
    return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 })
  }

  try {
    console.log('[GOOGLE] 토큰 요청 시작')
    
    // 구글에서 액세스 토큰 받기
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code: code,
        redirect_uri: 'http://localhost:3000/api/auth/google',
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('[GOOGLE] 토큰 응답:', tokenData)

    if (!tokenResponse.ok) {
      console.error('[GOOGLE] 토큰 요청 실패:', tokenData)
      throw new Error(tokenData.error_description || 'Failed to get access token')
    }

    const accessToken = tokenData.access_token
    console.log('[GOOGLE] 액세스 토큰 받음:', accessToken?.substring(0, 20) + '...')

    // 토큰으로 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    const googleUserInfo = await userInfoResponse.json()
    console.log('[GOOGLE] 사용자 정보:', googleUserInfo)

    const googleId = googleUserInfo.id
    const googleName = googleUserInfo.name

    // 현재 로그인한 사용자 정보 가져오기
    const userEmail = decodeURIComponent(state || '')
    console.log('[GOOGLE] 연동할 사용자 이메일:', userEmail)

    if (!userEmail) {
      console.error('[GOOGLE] 사용자 이메일이 없습니다')
      return NextResponse.json({ error: 'User email not provided' }, { status: 400 })
    }

    // MongoDB에 토큰 저장
    console.log('[GOOGLE] MongoDB에 토큰 저장 시작')
    const client = await clientPromise
    const db = client.db('ONAIR')
    const collection = db.collection('USER')

    const result = await collection.updateOne(
      { email: userEmail },
      { 
        $set: { 
          USER_GOOGLETOKEN: accessToken,
          GOOGLE_USER_ID: googleId,
          GOOGLE_USER_INFO: googleUserInfo,
          updatedAt: new Date()
        }
      }
    )

    console.log('[GOOGLE] MongoDB 저장 결과:', result)
    console.log('[GOOGLE] 매칭된 문서 수:', result.matchedCount)
    console.log('[GOOGLE] 수정된 문서 수:', result.modifiedCount)

    // 저장된 데이터 확인
    const savedUser = await collection.findOne({ email: userEmail })
    console.log('[GOOGLE] 저장된 사용자 데이터:', {
      email: savedUser?.email,
      hasGoogleToken: !!savedUser?.USER_GOOGLETOKEN,
      googleUserId: savedUser?.GOOGLE_USER_ID,
      tokenLength: savedUser?.USER_GOOGLETOKEN?.length
    })

    // 성공 응답과 함께 메인 페이지로 리다이렉트
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>구글 연동 완료</title>
        </head>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <h2>구글 연동 완료</h2>
              <p>잠시 후 메인 페이지로 이동합니다...</p>
            </div>
          </div>
          
          <script>
            console.log('[GOOGLE] 구글 연동 성공!');
            console.log('[GOOGLE] 구글 ID: ${googleId}');
            
            alert('구글 계정이 성공적으로 연동되었습니다!');
            window.location.href = '/';
          </script>
        </body>
      </html>
    `, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      },
    })

  } catch (error) {
    console.error('[GOOGLE] 구글 OAuth 에러:', error)
    return NextResponse.json({ 
      error: 'Failed to connect Google account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 