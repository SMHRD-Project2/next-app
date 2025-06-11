import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userStr = searchParams.get('user')

  if (!userStr) {
    return NextResponse.redirect(new URL('/auth/login?error=no_user_data', request.url))
  }

  try {
    const userProfile = JSON.parse(decodeURIComponent(userStr))
    console.log('[KAKAO LOGIN SUCCESS] 사용자 프로필:', userProfile)

    // 로그인 성공 처리 HTML 반환 (UTF-8 인코딩 명시)
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>카카오 로그인 성공</title>
        </head>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <h2>로그인 중...</h2>
              <p>잠시만 기다려주세요.</p>
            </div>
          </div>
          
          <script>
            console.log('[KAKAO LOGIN SUCCESS] 로그인 성공');
            console.log('[KAKAO LOGIN SUCCESS] 사용자 정보:', ${JSON.stringify(userProfile)});
            
            // localStorage에 로그인 정보 저장
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userProfile", JSON.stringify({
              id: "${userProfile.id}",
              email: "${userProfile.email}",
              name: "${userProfile.name}",
              role: "${userProfile.role || 'user'}"
            }));
            
            console.log('[KAKAO LOGIN SUCCESS] localStorage에 저장된 정보:', {
              id: "${userProfile.id}",
              email: "${userProfile.email}",
              name: "${userProfile.name}",
              role: "${userProfile.role || 'user'}"
            });
            
            // 로그인 상태 변경 이벤트 발생
            window.dispatchEvent(new Event('localStorageChange'));
            
            // 메인 페이지로 이동
            setTimeout(() => {
              alert('${userProfile.name}님, 카카오 로그인이 완료되었습니다!');
              window.location.href = '/';
            }, 1000);
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
    console.error('[KAKAO LOGIN SUCCESS] 사용자 데이터 파싱 오류:', error)
    return NextResponse.redirect(new URL('/auth/login?error=user_data_parse_failed', request.url))
  }
} 