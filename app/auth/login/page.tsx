'use client'

import { useSearchParams } from 'next/navigation'
import { LoginForm } from "@/components/auth/login-form"
import { Mic } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'no_linked_account':
        return '연동된 카카오 계정이 없습니다. 먼저 회원가입을 하고 계정을 연동해주세요.'
      case 'kakao_login_failed':
        return '카카오 로그인 중 오류가 발생했습니다.'
      case 'no_code':
        return '인증 코드를 받지 못했습니다.'
      default:
        return message || null
    }
  }

  const errorMessage = getErrorMessage(error)

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 브랜딩 섹션 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-onair-mint/20 to-onair-blue/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/new-bg.jpg')] bg-cover bg-center opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-onair-bg/90 to-onair-bg/70"></div>

        <div className="relative z-10 flex flex-col justify-center px-20 text-white">
          <div className="mb-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-onair-mint rounded-full flex items-center justify-center">
                <Mic className="w-7 h-7 text-onair-bg" />
              </div>
              <span className="text-3xl font-bold text-onair-mint">ON AIR</span>
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-4">입으로 완성하는 꿈</h1>
          <p className="text-xl text-onair-text-sub mb-8">
            AI 기반 아나운서 발음 훈련으로
            <br />
            완벽한 발음을 만들어보세요
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-onair-mint rounded-full"></div>
              <span className="text-onair-text-sub">실시간 AI 발음 분석</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-onair-orange rounded-full"></div>
              <span className="text-onair-text-sub">아나운서 음성 클로닝</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-onair-blue rounded-full"></div>
              <span className="text-onair-text-sub">맞춤형 훈련 커리큘럼</span>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 로그인 폼 섹션 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-onair-bg">
        <div className="w-full max-w-md">
          {/* 모바일용 로고 */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="flex items-center justify-center space-x-2">
              <div className="w-10 h-10 bg-onair-mint rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6 text-onair-bg" />
              </div>
              <span className="text-2xl font-bold text-onair-mint">ON AIR</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-onair-text mb-2">로그인</h2>
            <p className="text-onair-text-sub">계정에 로그인하여 훈련을 시작하세요</p>
          </div>

          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errorMessage}</p>
              {error === 'no_linked_account' && (
                <p className="text-red-600 text-sm mt-2">
                  <Link href="/auth/signup" className="underline font-medium">
                    회원가입 페이지로 이동
                  </Link>
                </p>
              )}
            </div>
          )}

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-onair-text-sub text-sm">
              아직 계정이 없으신가요?{" "}
              <Link href="/auth/signup" className="text-onair-mint hover:text-onair-mint/80 font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
