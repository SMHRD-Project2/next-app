import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Volume2 } from "lucide-react"

export function TodayMissionCard() {
  const todayMission = {
    category: "뉴스 읽기",
    text: "오늘 서울 지역에 첫눈이 내렸습니다. 기상청은 내일까지 눈이 계속될 것으로 예보했습니다.",
    difficulty: "중급",
    estimatedTime: "3분",
  }

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-onair-text">
          <span>오늘의 훈련 문장</span>
          <span className="text-sm font-normal text-onair-mint bg-onair-mint/10 px-2 py-1 rounded">
            {todayMission.category}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-onair-bg rounded-lg border border-onair-text-sub/10">
          <p className="text-onair-text leading-relaxed">{todayMission.text}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-onair-text-sub">
          <span>난이도: {todayMission.difficulty}</span>
          <span>예상 시간: {todayMission.estimatedTime}</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-onair-text-sub/20 text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            AI 예시 듣기
          </Button>
          <Button size="sm" className="flex-1 bg-onair-mint text-onair-bg hover:bg-onair-mint/90">
            <Play className="w-4 h-4 mr-2" />
            지금 시작하기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
