import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  console.log("[API] 로그아웃 요청 받음")
  try {
    // 쿠키에서 로그인 상태 제거
    const cookieStore = cookies()
    cookieStore.delete('isLoggedIn')
    console.log("[API] 쿠키 삭제 완료")

    return NextResponse.json({ 
      success: true,
      message: '로그아웃되었습니다.' 
    })
  } catch (error) {
    console.error('[API] 로그아웃 처리 중 오류:', error)
    return NextResponse.json(
      { 
        success: false,
        message: '로그아웃 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
} 