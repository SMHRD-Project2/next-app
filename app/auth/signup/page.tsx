import { SignupForm } from "@/components/auth/signup-form"
import { Mic } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 브랜딩 섹션 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-onair-mint/20 to-onair-blue/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/new-bg.jpg')] bg-cover bg-center opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-onair-bg/90 to-onair-bg/70"></div>

        <div className="relative z-10 flex flex-col justify-center px-20 text-white">
          <div className="mb-8">
            <Link href="/" className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-onair-mint rounded-full flex items-center justify-center">
                <Mic className="w-7 h-7 text-onair-bg" />
              </div>
              <span className="text-3xl font-bold text-onair-mint">ON AIR</span>
            </Link>
            <h1 className="text-4xl font-bold mb-4">지금 시작하세요</h1>
            <p className="text-xl text-onair-text-sub mb-8">
              수천 명의 아나운서 지망생들이
              <br />
              ON AIR와 함께 꿈을 이루고 있습니다
            </p>
          </div>

          <div className="bg-onair-bg-sub/50 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-onair-mint mb-4">ON AIR의 특별함</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-onair-mint/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-onair-mint rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-onair-text">실시간 AI 피드백</p>
                  <p className="text-sm text-onair-text-sub">발음, 억양, 톤을 즉시 분석</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-onair-orange/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-onair-orange rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-onair-text">맞춤형 훈련</p>
                  <p className="text-sm text-onair-text-sub">개인별 약점 분석 및 개선</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-onair-blue/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-onair-blue rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-onair-text">진도 관리</p>
                  <p className="text-sm text-onair-text-sub">체계적인 학습 진행 상황 추적</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 회원가입 폼 섹션 */}
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
            <h2 className="text-2xl font-bold text-onair-text mb-2">회원가입</h2>
            <p className="text-onair-text-sub">간편하게 가입하고 훈련을 시작하세요</p>
          </div>

          <SignupForm />

          <div className="mt-6 text-center">
            <p className="text-onair-text-sub text-sm">
              이미 계정이 있으신가요?{" "}
              <Link href="/auth/login" className="text-onair-mint hover:text-onair-mint/80 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
