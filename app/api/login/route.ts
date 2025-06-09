import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // TODO: 실제 데이터베이스에서 사용자 확인 로직 구현
    // 임시로 하드코딩된 사용자 정보로 검증
    if (email === "test@example.com" && password === "password123") {
      const user = {
        name: "테스트 사용자",
        email: email,
        image: "/placeholder.svg?height=32&width=32",
      }

      // 쿠키에 로그인 상태 저장
      const cookieStore = cookies()
      cookieStore.set('isLoggedIn', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1주일
      })

      return NextResponse.json({ user })
    }

    return NextResponse.json(
      { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    )
  } catch (error) {
    console.error('로그인 처리 중 오류:', error)
    return NextResponse.json(
      { message: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 