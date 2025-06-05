import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Target, Clock, Award } from "lucide-react"

export function StatsCards() {
  const stats = [
    {
      title: "오늘 훈련 시간",
      value: "25분",
      change: "+5분",
      icon: Clock,
      color: "text-onair-mint",
    },
    {
      title: "평균 정확도",
      value: "88%",
      change: "+3%",
      icon: Target,
      color: "text-onair-orange",
    },
    {
      title: "연속 훈련일",
      value: "7일",
      change: "신기록!",
      icon: TrendingUp,
      color: "text-onair-blue",
    },
    {
      title: "획득 배지",
      value: "12개",
      change: "+2개",
      icon: Award,
      color: "text-onair-mint",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="bg-onair-bg-sub border-onair-text-sub/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-onair-text-sub text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-onair-text">{stat.value}</p>
                  <p className={`text-xs ${stat.color}`}>{stat.change}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
