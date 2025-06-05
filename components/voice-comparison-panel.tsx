"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { useState } from "react"

export function VoiceComparisonPanel() {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)

  const tracks = [
    { id: "my", label: "내 음성", color: "onair-orange" },
    { id: "ai", label: "AI 예시", color: "onair-mint" },
    { id: "clone", label: "아나운서 클로닝", color: "onair-blue" },
  ]

  const handlePlay = (trackId: string) => {
    setPlayingTrack(playingTrack === trackId ? null : trackId)
  }

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20">
      <CardHeader>
        <CardTitle className="text-onair-text">음성 비교 분석</CardTitle>
        <p className="text-onair-text-sub text-sm">세 가지 음성을 비교하여 차이점을 확인해보세요</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {tracks.map((track) => (
          <div key={track.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-onair-text font-medium">{track.label}</span>
              <Button
                onClick={() => handlePlay(track.id)}
                size="sm"
                variant="outline"
                className={`border-${track.color} text-${track.color} hover:bg-${track.color} hover:text-onair-bg`}
              >
                {playingTrack === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>

            {/* 음성 파형 시각화 */}
            <div className="flex items-center space-x-1 h-8 bg-onair-bg rounded p-1">
              {Array.from({ length: 60 }).map((_, i) => (
                <div
                  key={i}
                  className={`bg-${track.color}/60 rounded-full ${playingTrack === track.id ? "animate-wave" : ""}`}
                  style={{
                    width: "2px",
                    height: `${Math.random() * 20 + 5}px`,
                    animationDelay: playingTrack === track.id ? `${i * 0.05}s` : "0s",
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 bg-onair-bg rounded-lg border border-onair-text-sub/10">
          <h4 className="font-semibold text-onair-text mb-2">비교 분석</h4>
          <ul className="space-y-1 text-sm text-onair-text-sub">
            <li>• AI 예시와 비교하여 억양이 85% 일치합니다</li>
            <li>• 아나운서 클로닝과 비교하여 톤이 92% 유사합니다</li>
            <li>• 전체적으로 안정적인 발화 패턴을 보입니다</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
