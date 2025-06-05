import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Play } from "lucide-react"
import { AccuracyTrendChart } from "@/components/accuracy-trend-chart"
import { WaveformVisualizer } from "@/components/waveform-visualizer"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0 bg-[url('/images/studio-background.jpg')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-r from-onair-bg/90 to-onair-bg/70"></div>
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
              asChild
              size="lg"
              className="bg-onair-orange hover:bg-onair-orange/90 text-onair-bg font-medium px-6"
            >
              <Link href="/training" className="flex items-center gap-2">
                지금 훈련 시작하기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <section className="container mx-auto px-4 py-8 -mt-16 relative z-20">
        <div className="grid md:grid-cols-2 gap-6">
          {/* 오늘의 미션 카드 */}
          <Card className="bg-onair-bg-sub border-onair-text-sub/10 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-onair-text">오늘의 미션</h2>
                <span className="bg-onair-mint/20 text-onair-mint text-xs px-2 py-1 rounded-full">2024년 6월 3일</span>
              </div>

              <div className="space-y-4">
                <div className="bg-onair-bg p-4 rounded-lg">
                  <p className="text-onair-text">
                    국내 주요 언론사들은 <span className="text-onair-mint font-medium">디지털 콘텐츠</span> 제작에
                    온라인 <span className="text-onair-mint font-medium">뉴미디어 플랫폼</span>을 오늘의 전략을 개선하고
                    있습니다.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-onair-bg text-onair-mint hover:bg-onair-bg/80 flex-shrink-0"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    듣기
                  </Button>
                  <WaveformVisualizer />
                </div>

                <Button className="w-full bg-onair-orange/90 hover:bg-onair-orange text-onair-bg">
                  이 문장으로 훈련하기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 발음 정확도 트렌드 카드 */}
          <Card className="bg-onair-bg-sub border-onair-text-sub/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-onair-text">발음 정확도 트렌드</h2>
                <span className="text-onair-text-sub text-xs">지난 7일간의 성과</span>
              </div>

              <div className="h-[240px]">
                <AccuracyTrendChart />
              </div>

              <div className="flex justify-between mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-onair-mint"></div>
                  <span className="text-xs text-onair-text-sub">발음 정확도</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-onair-blue"></div>
                  <span className="text-xs text-onair-text-sub">억양 정확도</span>
                </div>
                <Button size="sm" variant="ghost" className="text-onair-text-sub hover:text-onair-text">
                  상세 보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
    </div>
  )
}
