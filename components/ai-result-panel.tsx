import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function AIResultPanel() {
  const results = {
    pronunciation: 85,
    intonation: 78,
    tone: 92,
    stability: 88,
  }

  const feedback = [
    { type: "good", text: "전체적인 발음이 명확합니다" },
    { type: "improve", text: "'습니다' 부분의 억양을 더 자연스럽게 해보세요" },
    { type: "tip", text: "문장 끝에서 톤을 살짝 낮춰보세요" },
  ]

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20">
      <CardHeader>
        <CardTitle className="text-onair-text">AI 분석 결과</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 점수 */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(results).map(([key, value]) => {
            const labels = {
              pronunciation: "발음 정확도",
              intonation: "억양",
              tone: "톤",
              stability: "안정성",
            }

            const getColor = (score: number) => {
              if (score >= 90) return "text-onair-mint"
              if (score >= 80) return "text-onair-orange"
              return "text-red-400"
            }

            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-onair-text-sub text-sm">{labels[key as keyof typeof labels]}</span>
                  <span className={`font-semibold ${getColor(value)}`}>{value}점</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            )
          })}
        </div>

        {/* 피드백 */}
        <div className="space-y-3">
          <h4 className="font-semibold text-onair-text">상세 피드백</h4>
          {feedback.map((item, index) => {
            const colors = {
              good: "bg-onair-mint/10 text-onair-mint border-onair-mint/20",
              improve: "bg-onair-orange/10 text-onair-orange border-onair-orange/20",
              tip: "bg-onair-blue/10 text-onair-blue border-onair-blue/20",
            }

            return (
              <div key={index} className={`p-3 rounded-lg border ${colors[item.type as keyof typeof colors]}`}>
                <p className="text-sm">{item.text}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
