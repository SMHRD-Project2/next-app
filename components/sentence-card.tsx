"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, RefreshCw } from "lucide-react" // 250605 박남규 추가: 새로고침 아이콘 import

interface SentenceCardProps {
  sentence: string
  onRefresh?: () => void; // 250605 박남규 추가: 새로고침 버튼 클릭 핸들러 prop (optional)
}

export function SentenceCard({ sentence, onRefresh }: SentenceCardProps) {
  const [waveformHeights, setWaveformHeights] = useState<number[]>([])

  useEffect(() => {
    // 클라이언트 사이드에서만 랜덤 값 생성
    const heights = Array.from({ length: 40 }, () => Math.random() * 30 + 10)
    setWaveformHeights(heights)
  }, [])

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20">
      <CardHeader>
        <CardTitle className="text-onair-text flex items-center justify-between">
          <span>훈련 문장</span>
          <div className="flex items-center space-x-2 ml-auto">
            {onRefresh && (
              <Button
              variant="outline"
              size="sm"
                className="border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg"
                onClick={onRefresh}
                aria-label="문장 새로고침"
                title="다른 문장으로 교체"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              AI 예시 듣기
            </Button>
          </div>

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
