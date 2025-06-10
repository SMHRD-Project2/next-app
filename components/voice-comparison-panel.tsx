"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Lock, LogIn } from "lucide-react"
import { useState, useEffect } from "react"
import { getAuthStatus } from "@/lib/auth-utils"

export function VoiceComparisonPanel() {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [waveformHeights, setWaveformHeights] = useState<{ [key: string]: number[] }>({})
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // 클라이언트 마운트 확인
    setIsClient(true)
    
    // 각 트랙별 파형 높이 생성
    const tracks = ["my", "ai", "clone"]
    const heights: { [key: string]: number[] } = {}
    tracks.forEach(track => {
      heights[track] = Array.from({ length: 60 }, () => Math.random() * 20 + 5)
    })
    setWaveformHeights(heights)

    // 클라이언트에서만 로그인 상태 확인
    if (typeof window !== "undefined") {
      const { isLoggedIn: loggedIn } = getAuthStatus()
      setIsLoggedIn(loggedIn)
    }

    // 로그인 상태 변경 감지
    const handleAuthChange = () => {
      if (typeof window !== "undefined") {
        const { isLoggedIn: loggedIn } = getAuthStatus()
        setIsLoggedIn(loggedIn)
      }
    }

    window.addEventListener('localStorageChange', handleAuthChange)
    return () => window.removeEventListener('localStorageChange', handleAuthChange)
  }, [])

  const tracks = [
    { id: "my", label: "내 음성", color: "onair-orange" },
    { id: "ai", label: "AI 예시", color: "onair-mint" },
    { id: "clone", label: "아나운서 클로닝", color: "onair-blue" },
  ]

  const handlePlay = (trackId: string) => {
    setPlayingTrack(playingTrack === trackId ? null : trackId)
  }

  const handleLoginRedirect = () => {
    window.location.href = "/auth/login"
  }

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20 relative">
      <CardHeader>
        <CardTitle className="text-onair-text">음성 비교 분석</CardTitle>
        <p className="text-onair-text-sub text-sm">세 가지 음성을 비교하여 차이점을 확인해보세요</p>
      </CardHeader>
      <CardContent className="space-y-6">
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
              {isClient && waveformHeights[track.id] ? (
                waveformHeights[track.id].map((height, i) => (
                  <div
                    key={i}
                    className={`bg-${track.color}/60 rounded-full ${playingTrack === track.id ? "animate-wave" : ""}`}
                    style={{
                      width: "2px",
                      height: `${height}px`,
                      animationDelay: playingTrack === track.id ? `${i * 0.05}s` : "0s",
                    }}
                  />
                ))
              ) : (
                // SSR 및 초기 로딩 시 정적 높이 사용
                Array.from({ length: 60 }).map((_, i) => (
                  <div
                    key={i}
                    className={`bg-${track.color}/60 rounded-full ${playingTrack === track.id ? "animate-wave" : ""}`}
                    style={{
                      width: "2px",
                      height: "15px", // 고정 높이
                      animationDelay: playingTrack === track.id ? `${i * 0.05}s` : "0s",
                    }}
                  />
                ))
              )}
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

      {/* 비회원 블러 처리 오버레이 */}
      {!isLoggedIn && (
        <div className="absolute inset-0 bg-onair-bg/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center p-6 bg-onair-bg-sub rounded-lg border border-onair-text-sub/20 max-w-sm mx-4">
            <Lock className="w-12 h-12 text-onair-mint mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-onair-text mb-2">
              로그인이 필요합니다
            </h3>
            <p className="text-onair-text-sub text-sm mb-4">
              음성 비교 분석을 확인하려면 로그인해주세요
            </p>
            <Button 
              onClick={handleLoginRedirect}
              className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              로그인하기
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
