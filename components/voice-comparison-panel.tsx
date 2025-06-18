"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Lock, LogIn } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { getAuthStatus } from "@/lib/auth-utils"
import { WaveformPlayer, type WaveformPlayerHandle } from "@/components/waveform-player"

interface VoiceComparisonPanelProps {
  myVoiceUrl: string | null
  waveformRef?: React.RefObject<WaveformPlayerHandle | null>
}

export function VoiceComparisonPanel({ myVoiceUrl, waveformRef }: VoiceComparisonPanelProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [waveformHeights, setWaveformHeights] = useState<{ [key: string]: number[] }>({})
  const [isClient, setIsClient] = useState(false)
  const internalRef = useRef<WaveformPlayerHandle | null>(null)
  const playerRef = waveformRef ?? internalRef

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
  useEffect(() => {
    if (playingTrack !== "my") {
      playerRef.current?.pause()
    }
  }, [playingTrack])

  const tracks = [
    { id: "my", label: "내 음성", color: "onair-orange" },
    { id: "ai", label: "AI 예시", color: "onair-mint" },
    { id: "clone", label: "아나운서 클로닝", color: "onair-blue" },
  ]

  const handlePlay = (trackId: string) => {
    if (trackId === "my" && myVoiceUrl) {
      if (playingTrack === "my") {
        playerRef.current?.pause()
        setPlayingTrack(null)
      } else {
        playerRef.current?.play()
        setPlayingTrack("my")
      }
      return
    }
    setPlayingTrack(playingTrack === trackId ? null : trackId)
  }

  const handleLoginRedirect = () => {
    window.location.href = "/auth/login"
  }

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20 relative">
      <CardHeader>
        {/* <CardTitle className="text-onair-text">파형 비교 분석</CardTitle> */}
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
            {track.id === "my" && myVoiceUrl ? (
              <div className="w-full">
                <WaveformPlayer ref={playerRef} url={myVoiceUrl} />
              </div>
            ) : (
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
            )}
          </div>
        ))}

      </CardContent>

      {/* 비회원 블러 처리 오버레이 */}
      {!isLoggedIn && (
        <div className="absolute inset-0 bg-onair-bg/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-onair-text font-medium">로그인이 필요한 기능입니다</p>
            <Button
              onClick={handleLoginRedirect}
              className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
            >
              로그인하기
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
