import { Card, CardContent } from "@/components/ui/card"
import { Calendar, TrendingUp, Award } from "lucide-react"

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-onair-mint">훈련 기록</h1>
        <p className="text-onair-text-sub">훈련 기록을 관리하고 성장 과정을 확인해보세요</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-onair-bg-sub border-onair-text-sub/20">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-onair-mint mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-onair-text">15일</h3>
            <p className="text-onair-text-sub">총 훈련 일수</p>
          </CardContent>
        </Card>

        <Card className="bg-onair-bg-sub border-onair-text-sub/20">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-onair-orange mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-onair-text">87%</h3>
            <p className="text-onair-text-sub">평균 정확도</p>
          </CardContent>
        </Card>

        <Card className="bg-onair-bg-sub border-onair-text-sub/20">
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 text-onair-blue mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-onair-text">12개</h3>
            <p className="text-onair-text-sub">훈련 갯수</p>
          </CardContent>
        </Card>
      </div>

      {/* 훈련 기록 */}
      <Card className="bg-onair-bg-sub border-onair-text-sub/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-onair-mint" />
            <h2 className="text-xl font-semibold text-onair-text">훈련 기록</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                id: 1,
                date: "2024-01-07",
                category: "뉴스 읽기",
                sentence: "오늘 서울 지역에 첫눈이 내렸습니다.",
                scores: { pronunciation: 91, intonation: 88, tone: 92 },
                status: "완료",
              },
              {
                id: 2,
                date: "2024-01-07",
                category: "긴 문장",
                sentence: "정부는 새로운 경제 정책을 발표하며...",
                scores: { pronunciation: 85, intonation: 82, tone: 89 },
                status: "완료",
              },
              {
                id: 3,
                date: "2024-01-06",
                category: "짧은 문장",
                sentence: "안녕하세요, 시청자 여러분.",
                scores: { pronunciation: 88, intonation: 85, tone: 86 },
                status: "완료",
              },
            ].map((item) => {
              const getScoreColor = (score: number) => {
                if (score >= 90) return "text-onair-mint"
                if (score >= 80) return "text-onair-orange"
                return "text-red-400"
              }

              const getCategoryColor = (category: string) => {
                switch (category) {
                  case "뉴스 읽기":
                    return "bg-onair-mint/10 text-onair-mint"
                  case "긴 문장":
                    return "bg-onair-orange/10 text-onair-orange"
                  case "짧은 문장":
                    return "bg-onair-blue/10 text-onair-blue"
                  default:
                    return "bg-onair-text-sub/10 text-onair-text-sub"
                }
              }

              return (
                <div key={item.id} className="p-4 bg-onair-bg rounded-lg border border-onair-text-sub/10 space-y-3">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-onair-text-sub text-sm">{item.date}</span>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium border border-onair-mint text-onair-mint">
                      {item.status}
                    </span>
                  </div>

                  {/* 문장 */}
                  <p className="text-onair-text">{item.sentence}</p>

                  {/* 점수 */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-onair-text-sub text-xs">발음</p>
                      <p className={`font-semibold ${getScoreColor(item.scores.pronunciation)}`}>
                        {item.scores.pronunciation}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-onair-text-sub text-xs">억양</p>
                      <p className={`font-semibold ${getScoreColor(item.scores.intonation)}`}>
                        {item.scores.intonation}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-onair-text-sub text-xs">톤</p>
                      <p className={`font-semibold ${getScoreColor(item.scores.tone)}`}>{item.scores.tone}</p>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm border border-onair-text-sub/20 text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub rounded flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 5v10l7-5-7-5z" />
                      </svg>
                      음성 재생
                    </button>
                    <button className="px-3 py-1 text-sm bg-onair-mint text-onair-bg hover:bg-onair-mint/90 rounded flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      다시 훈련
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
