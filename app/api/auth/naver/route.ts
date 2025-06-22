import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  //console.log('[NAVER] 네이버 콜백 시작')
  
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  //console.log('[NAVER] 받은 파라미터:', { code: code?.substring(0, 10) + '...', state })

  if (!code) {
    //console.error('[NAVER] Authorization code가 없습니다')
    return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 })
  }

  try {
    //console.log('[NAVER] 토큰 요청 시작')
    
    // 네이버에서 액세스 토큰 받기
    const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code: code,
        state: state || '',
      }),
    })

    const tokenData = await tokenResponse.json()
    //console.log('[NAVER] 토큰 응답:', tokenData)

    if (!tokenResponse.ok) {
      //console.error('[NAVER] 토큰 요청 실패:', tokenData)
      throw new Error(tokenData.error_description || 'Failed to get access token')
    }

    const accessToken = tokenData.access_token
    //console.log('[NAVER] 액세스 토큰 받음:', accessToken?.substring(0, 20) + '...')

    // 토큰으로 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    const userInfoData = await userInfoResponse.json()
    //console.log('[NAVER] 사용자 정보:', userInfoData)

    const naverUserInfo = userInfoData.response
    const naverId = naverUserInfo.id
    const naverName = naverUserInfo.name || naverUserInfo.nickname

    // 현재 로그인한 사용자 정보 가져오기
    const userEmail = decodeURIComponent(state || '')
    //console.log('[NAVER] 연동할 사용자 이메일:', userEmail)

    if (!userEmail) {
      //console.error('[NAVER] 사용자 이메일이 없습니다')
      return NextResponse.json({ error: 'User email not provided' }, { status: 400 })
    }

    // MongoDB에 토큰 저장
    //console.log('[NAVER] MongoDB에 토큰 저장 시작')
    const client = await clientPromise
    const db = client.db('ONAIR')
    const collection = db.collection('USER')

    const result = await collection.updateOne(
      { email: userEmail },
      { 
        $set: { 
          USER_NAVERTOKEN: accessToken,
          NAVER_USER_ID: naverId,
          NAVER_USER_INFO: naverUserInfo,
          updatedAt: new Date()
        }
      }
    )

    //console.log('[NAVER] MongoDB 저장 결과:', result)
    //console.log('[NAVER] 매칭된 문서 수:', result.matchedCount)
    //console.log('[NAVER] 수정된 문서 수:', result.modifiedCount)

    // 저장된 데이터 확인
    const savedUser = await collection.findOne({ email: userEmail })
    //console.log('[NAVER] 저장된 사용자 데이터:', {
    //   email: savedUser?.email,
    //   hasNaverToken: !!savedUser?.USER_NAVERTOKEN,
    //   naverUserId: savedUser?.NAVER_USER_ID,
    //   tokenLength: savedUser?.USER_NAVERTOKEN?.length
    // })

    // 성공 응답과 함께 창 닫기
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>네이버 연동 완료</title>
        </head>
        <body>
          <script>
            //console.log('[NAVER POPUP] 네이버 연동 성공!');
            //console.log('[NAVER POPUP] 네이버 ID: ${naverId}');
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'SNS_CONNECT_SUCCESS', 
                provider: 'naver',
                success: true 
              }, '*');
              window.close();
            } else {
              alert('네이버 연동이 완료되었습니다!');
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
    //console.error('[NAVER] 네이버 OAuth 에러:', error)
    return NextResponse.json({ 
      error: 'Failed to connect Naver account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 