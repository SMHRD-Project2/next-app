import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userStr = searchParams.get('user')

  if (!userStr) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <title>네이버 로그인 오류</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'SOCIAL_LOGIN_ERROR', 
                provider: 'naver',
                error: '사용자 데이터가 없습니다'
              }, '*');
              window.close();
            } else {
              window.location.href = '/auth/login?error=no_user_data';
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  try {
    const userProfile = JSON.parse(decodeURIComponent(userStr))
    //console.log('[NAVER LOGIN SUCCESS] 사용자 프로필:', userProfile)

    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>네이버 로그인 성공</title>
        </head>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <h2>네이버 로그인 성공!</h2>
              <p>창을 닫는 중...</p>
            </div>
          </div>
          
          <script>
            //console.log('[NAVER LOGIN SUCCESS] 로그인 성공');
            //console.log('[NAVER LOGIN SUCCESS] 사용자 정보:', ${JSON.stringify(userProfile)});
            
            // localStorage에 로그인 정보 저장
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userProfile", JSON.stringify({
              id: "${userProfile.id}",
              email: "${userProfile.email}",
              name: "${userProfile.name}",
              role: "${userProfile.role || 'user'}"
            }));
            
            // 부모 창에 성공 메시지 전송
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'SOCIAL_LOGIN_SUCCESS', 
                provider: 'naver',
                user: {
                  id: "${userProfile.id}",
                  email: "${userProfile.email}",
                  name: "${userProfile.name}",
                  role: "${userProfile.role || 'user'}"
                }
              }, '*');
              window.close();
            } else {
              // 팝업이 아닌 경우 메인 페이지로 이동
              setTimeout(() => {
                alert('${userProfile.name}님, 네이버 로그인이 완료되었습니다!');
                window.location.href = '/';
              }, 1000);
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    //console.error('[NAVER LOGIN SUCCESS] 사용자 데이터 파싱 오류:', error)
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <title>네이버 로그인 오류</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'SOCIAL_LOGIN_ERROR', 
                provider: 'naver',
                error: '사용자 데이터 파싱 실패'
              }, '*');
              window.close();
            } else {
              window.location.href = '/auth/login?error=user_data_parse_failed';
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
}