import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  console.log('[NAVER LOGIN] 네이버 로그인 콜백 시작')
  
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    console.error('[NAVER LOGIN] Authorization code가 없습니다')
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
  }

  try {
    console.log('[NAVER LOGIN] 토큰 요청 시작')
    
    // 1. 네이버에서 액세스 토큰 받기
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
    console.log('[NAVER LOGIN] 토큰 응답:', tokenData)

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to get access token')
    }

    const accessToken = tokenData.access_token

    // 2. 네이버 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    const userInfoData = await userInfoResponse.json()
    console.log('[NAVER LOGIN] 네이버 사용자 정보:', userInfoData)

    const naverUserInfo = userInfoData.response
    const naverId = naverUserInfo.id
    const naverName = naverUserInfo.name || naverUserInfo.nickname || '네이버 사용자'

    console.log('[NAVER LOGIN] 네이버 ID:', naverId)
    console.log('[NAVER LOGIN] 네이버 이름:', naverName)

    // 3. MongoDB에서 연동된 계정 찾기
    const client = await clientPromise
    const db = client.db('ONAIR')
    const collection = db.collection('USER')

    console.log('[NAVER LOGIN] 네이버 ID로 계정 검색 시작:', naverId)
    
    // 네이버 ID로 연동된 계정 찾기
    let user = await collection.findOne({ 
      $or: [
        { NAVER_USER_ID: naverId },
        { 'NAVER_USER_INFO.id': naverId }
      ]
    })

    console.log('[NAVER LOGIN] 연동된 계정 검색 결과:', user ? '찾음' : '못찾음')

    if (!user) {
      // 연동된 계정이 없으면 alert 후 팝업 닫기 + 메인창에 메시지 전달
      console.log('[NAVER LOGIN] 연동된 계정이 없습니다. alert 후 팝업 닫기 및 메인창에 메시지 전달')
      
      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>네이버 로그인 안내</title>
          </head>
          <body>
            <script>
              alert('연동된 네이버 계정이 없습니다.\\n\\n먼저 일반 회원가입을 진행한 후,\\n로그인하여 프로필에서 네이버 계정을 연동해주세요.');
              if (window.opener) {
                window.opener.postMessage({ type: 'SOCIAL_LOGIN_ERROR', error: 'no_linked_account' }, window.location.origin);
              }
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      })
    }

    console.log('[NAVER LOGIN] 찾은 사용자 정보:', {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    })

    // 4. 기존 연동 계정의 네이버 토큰 업데이트
    await collection.updateOne(
      { _id: user._id },
      { 
        $set: {
          USER_NAVERTOKEN: accessToken,
          NAVER_USER_ID: naverId,
          NAVER_USER_INFO: naverUserInfo,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    )
    console.log('[NAVER LOGIN] 기존 계정 토큰 업데이트 완료')

    // 5. 로그인 성공 처리 - 데이터베이스의 실제 사용자 정보 사용
    const userProfile = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    }

    console.log('[NAVER LOGIN] 로그인 성공, 사용자 프로필:', userProfile)

    // 성공 페이지로 리다이렉트하면서 사용자 정보 전달
    const successUrl = new URL('/api/auth/naver/success', request.url)
    successUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(userProfile)))
    
    return NextResponse.redirect(successUrl)

  } catch (error) {
    console.error('[NAVER LOGIN] 네이버 로그인 에러:', error)
    return NextResponse.redirect(new URL('/auth/login?error=naver_login_failed&message=네이버 로그인 중 오류가 발생했습니다.', request.url))
  }
} 