import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"

interface SentenceCardProps {
  sentence: string
}

export function SentenceCard({ sentence }: SentenceCardProps) {
  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20">
      <CardHeader>
        <CardTitle className="text-onair-text flex items-center justify-between">
          <span>훈련 문장</span>
          <Button
            variant="outline"
            size="sm"
            className="border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            AI 예시 듣기
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-6 bg-onair-bg rounded-lg border border-onair-text-sub/10">
          <p className="text-lg leading-relaxed text-onair-text text-center">{sentence}</p>
        </div>

        {/* AI 예시 음성 파형 시각화 */}
        <div className="flex items-center justify-center space-x-1 h-12 bg-onair-bg rounded-lg p-2">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="bg-onair-mint/60 rounded-full animate-wave"
              style={{
                width: "3px",
                height: `${Math.random() * 30 + 10}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
