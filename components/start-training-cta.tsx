import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, ArrowRight } from "lucide-react"
import Link from "next/link"

export function StartTrainingCTA() {
  return (
    <Card className="bg-gradient-to-r from-onair-mint/10 to-onair-blue/10 border-onair-mint/20">
      <CardContent className="p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-onair-mint/20 rounded-full flex items-center justify-center mx-auto">
          <Mic className="w-8 h-8 text-onair-mint" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-onair-text">지금 바로 훈련을 시작해보세요</h3>
          <p className="text-onair-text-sub">매일 조금씩, 꾸준한 연습이 완벽한 발음을 만듭니다</p>
        </div>

        <Button asChild size="lg" className="bg-onair-mint text-onair-bg hover:bg-onair-mint/90 font-semibold">
          <Link href="/training" className="flex items-center gap-2">
            훈련실로 이동
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
