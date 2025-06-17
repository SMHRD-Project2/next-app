'use client';


import Link from "next/link"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Play, Quote, Star } from "lucide-react"
import { WaveformVisualizer } from "@/components/waveform-visualizer"
import { useRouter } from "next/navigation"
import { AIVoiceShowcase } from "@/components/ai-voice-showcase"
import { useAuth } from "@/hooks/use-auth"



// 현재 한국 날짜를 가져오는 함수
function getCurrentKoreanDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${year}년 ${month}월 ${day}일`;
}



export default function HomePage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  const handleStartButtonClick = () => {
    if (isLoggedIn) {
      router.push('/training')
    } else {
      router.push('/auth/login')
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0 bg-[url('/images/new-bg.jpg')] bg-cover bg-center">
        {/* 배경 그라데이션 슬래쉬 수정 */}
          <div className="absolute inset-0 bg-gradient-to-r from-onair-bg/80 to-onair-bg/70"></div>
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-onair-bg to-transparent"></div>
        </div>

        {/* 히어로 콘텐츠 */}
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-2">
              <p className="text-onair-mint font-medium">입으로 완성하는 꿈</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">AI 기반 아나운서 발음 훈련</h1>
            </div>
            <p className="text-onair-text-sub text-lg md:text-xl max-w-lg">
              실제 아나운서 발화에 가까운 음성 훈련과 시각적 피드백으로 자기주도 반복학습이 가능한 실전형 플랫폼
            </p>
            <Button
              size="lg"
              className="bg-onair-orange hover:bg-onair-orange/90 text-onair-bg font-medium px-6"
              onClick={handleStartButtonClick}
            >
              <span className="flex items-center gap-2">
                지금 훈련 시작하기
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* AI 음성 모델 쇼케이스 */}
      <section className="container mx-auto px-4 py-8 -mt-16 relative z-20">
        <div className="grid md:grid-cols-2 gap-6">
          <AIVoiceShowcase
            gender="female"
            name="김주하"
            title="뉴스 앵커"
            description="정확하고 신뢰감 있는 발화 패턴으로 전문적인 뉴스 전달에 최적화된 음성 모델입니다."
            sampleText="안녕하세요, 저는 ON AIR의 AI 아나운서 김주하입니다. 저는 정확한 발음과 자연스러운 억양으로 뉴스와 정보를 전달하는 데 특화되어 있습니다."
          />

          <AIVoiceShowcase
            gender="male"
            name="이동욱"
            title="스포츠 캐스터"
            description="역동적이고 열정적인 발화 패턴으로 스포츠 중계와 해설에 최적화된 음성 모델입니다."
            sampleText="안녕하세요, 저는 ON AIR의 AI 아나운서 이동욱입니다. 저는 생동감 있는 발화와 명확한 전달력으로 스포츠 중계와 해설을 담당하고 있습니다."
          />
        </div>
      </section>

      {/* AI 평가 섹션 */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-onair-mint mb-2">AI 전문가의 평가</h2>
          <p className="text-onair-text-sub max-w-2xl mx-auto">
            ChatGPT와 같은 AI 언어 모델이 ON AIR의 음성 모델을 분석하고 평가한 결과입니다.
          </p>
        </div>

        <Card className="bg-onair-bg-sub border-onair-text-sub/20 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="bg-onair-mint/20 p-3 rounded-full flex-shrink-0">
                <Quote className="w-6 h-6 text-onair-mint" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-onair-text">AI 전문가 분석</h3>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-onair-orange fill-current" />
                    ))}
                  </div>
                </div>

                <p className="text-onair-text-sub leading-relaxed">
                  "ON AIR의 AI 음성 모델은 실제 아나운서의 발화 패턴을 매우 정확하게 재현하고 있습니다. 특히 억양, 강세,
                  휴지(pause)의 자연스러운 처리가 인상적입니다. 음성 합성 기술의 최신 발전을 잘 반영하고 있으며, 특히
                  한국어 특유의 발음 특성을 정확하게 구현한 점이 돋보입니다. 이러한 고품질 음성 모델은 발음 훈련에 있어
                  매우 효과적인 참고 자료가 될 것입니다."
                </p>

                <div className="pt-4 border-t border-onair-text-sub/10">
                  <p className="text-onair-text-sub">
                    <span className="text-onair-mint font-medium">주요 강점: </span>
                    자연스러운 억양 처리 (98%), 명확한 발음 (97%), 감정 표현 (95%), 전문성 (96%)
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-onair-text-sub italic">
                    "ON AIR의 AI 음성 모델은 현재 시장에서 가장 자연스럽고 전문적인 한국어 음성 합성 기술 중 하나로
                    평가됩니다. 특히 아나운서 훈련을 위한 목적으로는 최적의 선택입니다."
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 특징 섹션 */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-onair-mint mb-4">왜 ON AIR인가요?</h2>
          <p className="text-onair-text-sub max-w-2xl mx-auto">
            아나운서 및 스피치 입시/실무 준비생을 위한 맞춤형 AI 기반 발음 피드백 훈련 플랫폼입니다.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "실시간 피드백",
              description: "AI가 발음, 억양, 톤을 실시간으로 분석하여 즉각적인 피드백을 제공합니다.",
              icon: "🎯",
            },
            {
              title: "아나운서 클로닝",
              description: "실제 아나운서의 발화 패턴을 학습하여 최적의 발음 가이드를 제공합니다.",
              icon: "🎙️",
            },
            {
              title: "맞춤형 훈련",
              description: "개인의 발음 특성과 약점을 분석하여 맞춤형 훈련 커리큘럼을 제공합니다.",
              icon: "📈",
            },
          ].map((feature, index) => (
            <Card key={index} className="bg-onair-bg-sub border-onair-text-sub/10">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-onair-text mb-2">{feature.title}</h3>
                <p className="text-onair-text-sub">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="container mx-auto px-4 py-12">
        <Card className="bg-gradient-to-r from-onair-mint/10 to-onair-blue/10 border-onair-mint/20">
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-onair-text">지금 바로 AI 아나운서 훈련을 시작하세요</h2>
            <p className="text-onair-text-sub max-w-2xl mx-auto">
              ON AIR의 AI 음성 모델과 실시간 피드백 시스템으로 아나운서 수준의 발음을 완성하세요. 지금 가입하면 7일간
              무료로 모든 기능을 이용할 수 있습니다.
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg px-6"
                onClick={handleStartButtonClick}
              >
                무료로 시작하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
      {/* 스크롤 버튼 */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-10 h-10 rounded-full bg-onair-mint text-white flex items-center justify-center shadow-lg hover:bg-onair-mint/90 transition-colors"
          aria-label="맨 위로 스크롤"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="w-10 h-10 rounded-full bg-onair-mint text-white flex items-center justify-center shadow-lg hover:bg-onair-mint/90 transition-colors"
          aria-label="맨 아래로 스크롤"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
