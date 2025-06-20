import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  //console.log('[/app/api/auth/kakao/login/route.ts] 카카오 로그인 콜백 시작')
  
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    console.error('[/app/api/auth/kakao/login/route.ts] Authorization code가 없습니다')
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
  }

  try {
    //console.log('[KAKAO LOGIN] 토큰 요청 시작')
    
    const baseUrl = process.env.BASE_URL || 'https://next-app-gilt-one.vercel.app'
    const redirectUri = `${baseUrl}api/auth/kakao/login`
    
    console.log('[/app/api/auth/kakao/login/route.ts] Base URL:', baseUrl)
    console.log('[/app/api/auth/kakao/login/route.ts] Redirect URI:', redirectUri)
    
    // 1. 카카오에서 액세스 토큰 받기
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY!,
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()
    //console.log('[KAKAO LOGIN] 토큰 응답:', tokenData)

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to get access token')
    }

    const accessToken = tokenData.access_token

    // 2. 카카오 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    const kakaoUserInfo = await userInfoResponse.json()
    //console.log('[KAKAO LOGIN] 카카오 사용자 정보:', kakaoUserInfo)

    const kakaoId = kakaoUserInfo.id
    const kakaoName = kakaoUserInfo.properties?.nickname || '카카오 사용자'

    //console.log('[KAKAO LOGIN] 카카오 ID:', kakaoId)
    //console.log('[KAKAO LOGIN] 카카오 이름:', kakaoName)

    // 3. MongoDB에서 연동된 계정 찾기
    const client = await clientPromise
    const db = client.db('ONAIR')
    const collection = db.collection('USER')

    //console.log('[KAKAO LOGIN] 카카오 ID로 계정 검색 시작:', kakaoId)
    
    // 카카오 ID로 연동된 계정 찾기
    let user = await collection.findOne({ 
      $or: [
        { KAKAO_USER_ID: kakaoId },
        { 'KAKAO_USER_INFO.id': kakaoId }
      ]
    })

    //console.log('[KAKAO LOGIN] 연동된 계정 검색 결과:', user ? '찾음' : '못찾음')

    if (!user) {
      // 연동된 계정이 없으면 alert 후 회원가입 페이지로 이동
      //console.log('[KAKAO LOGIN] 연동된 계정이 없습니다. alert 후 회원가입 페이지로 이동')
      
      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>카카오 로그인 안내</title>
          </head>
          <body>
            <script>
              alert('연동된 카카오 계정이 없습니다.\\n\\n먼저 일반 회원가입을 진행한 후,\\n로그인하여 프로필에서 카카오 계정을 연동해주세요.');
              window.location.href = '/auth/signup';
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

    //console.log('[KAKAO LOGIN] 찾은 사용자 정보:', {
    //   _id: user._id,
    //   email: user.email,
    //   name: user.name,
    //   role: user.role
    // })

    // 4. 기존 연동 계정의 카카오 토큰 업데이트
    await collection.updateOne(
      { _id: user._id },
      { 
        $set: {
          USER_KAKAOTOKEN: accessToken,
          KAKAO_USER_ID: kakaoId,
          KAKAO_USER_INFO: kakaoUserInfo,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    )
    //console.log('[KAKAO LOGIN] 기존 계정 토큰 업데이트 완료')

    // 5. 로그인 성공 처리 - 데이터베이스의 실제 사용자 정보 사용
    const userProfile = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    }

    //console.log('[KAKAO LOGIN] 로그인 성공, 사용자 프로필:', userProfile)

    // 성공 페이지로 리다이렉트하면서 사용자 정보 전달
    const successUrl = new URL('/api/auth/kakao/success', request.url)
    successUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(userProfile)))
    
    return NextResponse.redirect(successUrl)

  } catch (error) {
    console.error('[/app/api/auth/kakao/login/route.ts] 카카오 로그인 에러:', error)
    return NextResponse.redirect(new URL('/auth/login?error=kakao_login_failed&message=카카오 로그인 중 오류가 발생했습니다.', request.url))
  }
} 