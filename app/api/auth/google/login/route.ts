import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  //console.log('[GOOGLE LOGIN] 구글 로그인 콜백 시작')
  //console.log('[GOOGLE LOGIN] Request URL:', request.url)
  //console.log('[GOOGLE LOGIN] Request method:', request.method)
  
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // console.log('[GOOGLE LOGIN] 받은 파라미터:', { 
  //   code: code ? code.substring(0, 10) + '...' : null, 
  //   state, 
  //   error 
  // })

  // 구글 인증 에러 처리
  if (error) {
    console.error('[GOOGLE LOGIN] 구글 인증 에러:', error)
    return NextResponse.redirect(new URL(`/auth/login?error=google_auth_error&message=${error}`, request.url))
  }

  if (!code) {
    console.error('[GOOGLE LOGIN] Authorization code가 없습니다')
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
  }

  try {
    //console.log('[GOOGLE LOGIN] 토큰 요청 시작')
    
    const baseUrl = process.env.BASE_URL || 'https://next-app-gilt-one.vercel.app'
    
    // 1. 구글에서 액세스 토큰 받기
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}api/auth/google/login`,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()
    //console.log('[GOOGLE LOGIN] 토큰 응답 상태:', tokenResponse.status)
    //console.log('[GOOGLE LOGIN] 토큰 응답:', tokenData)

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to get access token')
    }

    const accessToken = tokenData.access_token

    // 2. 구글 사용자 정보 가져오기
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    const googleUserInfo = await userInfoResponse.json()
    //console.log('[GOOGLE LOGIN] 구글 사용자 정보:', googleUserInfo)

    const googleId = googleUserInfo.id
    const googleName = googleUserInfo.name || '구글 사용자'
    const googleEmail = googleUserInfo.email

    //console.log('[GOOGLE LOGIN] 구글 ID:', googleId)
    //console.log('[GOOGLE LOGIN] 구글 이름:', googleName)
    //console.log('[GOOGLE LOGIN] 구글 이메일:', googleEmail)

    // 3. MongoDB에서 연동된 계정 찾기
    const client = await clientPromise
    const db = client.db('ONAIR')
    const collection = db.collection('USER')

    //console.log('[GOOGLE LOGIN] 구글 ID로 계정 검색 시작:', googleId)
    
    // 구글 ID로 연동된 계정 찾기
    let user = await collection.findOne({ 
      $or: [
        { GOOGLE_USER_ID: googleId },
        { 'GOOGLE_USER_INFO.id': googleId }
      ]
    })

    //console.log('[GOOGLE LOGIN] 연동된 계정 검색 결과:', user ? '찾음' : '못찾음')

    if (!user) {
      // 연동된 계정이 없으면 alert 후 회원가입 페이지로 이동
      //console.log('[GOOGLE LOGIN] 연동된 계정이 없습니다. alert 후 회원가입 페이지로 이동')
      
      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>구글 로그인 안내</title>
          </head>
          <body>
            <script>
              alert('연동된 구글 계정이 없습니다.\\n\\n먼저 일반 회원가입을 진행한 후,\\n로그인하여 프로필에서 구글 계정을 연동해주세요.');
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

    // console.log('[GOOGLE LOGIN] 찾은 사용자 정보:', {
    //   _id: user._id,
    //   email: user.email,
    //   name: user.name,
    //   role: user.role
    // })

    // 4. 기존 연동 계정의 구글 토큰 업데이트
    await collection.updateOne(
      { _id: user._id },
      { 
        $set: {
          USER_GOOGLETOKEN: accessToken,
          GOOGLE_USER_ID: googleId,
          GOOGLE_USER_INFO: googleUserInfo,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    )
    //console.log('[GOOGLE LOGIN] 기존 계정 토큰 업데이트 완료')

    // 5. 로그인 성공 처리 - 데이터베이스의 실제 사용자 정보 사용
    const userProfile = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    }

    //console.log('[GOOGLE LOGIN] 로그인 성공, 사용자 프로필:', userProfile)

    // 성공 페이지로 리다이렉트하면서 사용자 정보 전달
    const successUrl = new URL('api/auth/google/success', request.url)
    successUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(userProfile)))
    
    return NextResponse.redirect(successUrl)

  } catch (error) {
    console.error('[GOOGLE LOGIN] 구글 로그인 에러:', error)
    return NextResponse.redirect(new URL('/auth/login?error=google_login_failed&message=구글 로그인 중 오류가 발생했습니다.', request.url))
  }
} 