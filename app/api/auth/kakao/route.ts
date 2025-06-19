import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  //console.log('[KAKAO] 카카오 콜백 시작')
  
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  //console.log('[KAKAO] 받은 파라미터:', { code: code?.substring(0, 10) + '...', state })

  if (!code) {
    console.error('[KAKAO] Authorization code가 없습니다')
    return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 })
  }

  try {
    //console.log('[KAKAO] 토큰 요청 시작')
    
    const baseUrl = process.env.BASE_URL || 'next-app-gilt-one.vercel.app'
    
    // 카카오에서 액세스 토큰 받기
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY!,
        redirect_uri: `${baseUrl}/api/auth/kakao`,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()
    //console.log('[KAKAO] 토큰 응답:', tokenData)

    if (!tokenResponse.ok) {
      console.error('[KAKAO] 토큰 요청 실패:', tokenData)
      throw new Error(tokenData.error_description || 'Failed to get access token')
    }

    const accessToken = tokenData.access_token
    //console.log('[KAKAO] 액세스 토큰 받음:', accessToken?.substring(0, 20) + '...')

    // 토큰으로 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    const userInfo = await userInfoResponse.json()
    //console.log('[KAKAO] 사용자 정보:', userInfo)

    const kakaoId = userInfo.id
    const kakaoName = userInfo.properties?.nickname

    // 현재 로그인한 사용자 정보 가져오기
    const userEmail = decodeURIComponent(state || '')
    //console.log('[KAKAO] 연동할 사용자 이메일:', userEmail)

    if (!userEmail) {
      console.error('[KAKAO] 사용자 이메일이 없습니다')
      return NextResponse.json({ error: 'User email not provided' }, { status: 400 })
    }

    // MongoDB에 토큰 저장
    //console.log('[KAKAO] MongoDB에 토큰 저장 시작')
    const client = await clientPromise
    const db = client.db('ONAIR')
    const collection = db.collection('USER')

    const result = await collection.updateOne(
      { email: userEmail },
      { 
        $set: { 
          USER_KAKAOTOKEN: accessToken,
          KAKAO_USER_ID: kakaoId, // 카카오 ID 확실히 저장
          KAKAO_USER_INFO: userInfo,
          updatedAt: new Date()
        }
      }
    )

    //console.log('[KAKAO] MongoDB 저장 결과:', result)
    //console.log('[KAKAO] 매칭된 문서 수:', result.matchedCount)
    //console.log('[KAKAO] 수정된 문서 수:', result.modifiedCount)

    // 저장된 데이터 확인
    const savedUser = await collection.findOne({ email: userEmail })
    //console.log('[KAKAO] 저장된 사용자 데이터:', {
    //   email: savedUser?.email,
    //   hasKakaoToken: !!savedUser?.USER_KAKAOTOKEN,
    //   kakaoUserId: savedUser?.KAKAO_USER_ID,
    //   tokenLength: savedUser?.USER_KAKAOTOKEN?.length
    // })

    // 성공 응답과 함께 창 닫기 (HTML 부분만 수정)
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>카카오 연동 완료</title>
        </head>
        <body>
          <script>
            //console.log('[KAKAO POPUP] 카카오 연동 성공!');
            //console.log('[KAKAO POPUP] 카카오 ID: ${kakaoId}');
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'SNS_CONNECT_SUCCESS', 
                provider: 'kakao',
                success: true 
              }, '*');
              window.close();
            } else {
              alert('카카오 연동이 완료되었습니다!');
              window.location.href = '/';
            }
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
    console.error('[KAKAO] 카카오 OAuth 에러:', error)
    return NextResponse.json({ 
      error: 'Failed to connect Kakao account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 