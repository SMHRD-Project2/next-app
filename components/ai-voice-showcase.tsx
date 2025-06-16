"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Play, Pause, Volume2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AIVoiceShowcaseProps {
  gender: "male" | "female"
  name: string
  title: string
  description: string
  sampleText: string
}

export function AIVoiceShowcase({ gender, name, title, description, sampleText }: AIVoiceShowcaseProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [waveHeights, setWaveHeights] = useState<number[]>([])
  const [isClient, setIsClient] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number | null>(null)

  // 성별에 따른 색상 및 아바타 설정
  const colors = {
    male: {
      primary: "onair-blue",
      secondary: "onair-blue/20",
    },
    female: {
      primary: "onair-female",
      secondary: "onair-female/20",
    },
  }

  // 성별에 따른 오디오 파일 경로를 반환하는 헬퍼 함수
  const getAudioSource = (currentGender: "male" | "female") => {
    return currentGender === "female" ? "/audio/김주하_자기소개.wav" : "/audio/이동욱_자기소개.wav";
  };

  // 클라이언트 마운트 시 isClient 설정 및 파형 높이 초기화
  useEffect(() => {
    setIsClient(true)
    // 초기 파형 높이 설정 - 클라이언트에서만 실행
    setWaveHeights(Array.from({ length: 60 }, () => Math.random() * 20 + 5)) // 파형 높이 범위를 이전으로 유지 (5px ~ 25px)

    // AIVoiceShowcase 컴포넌트가 마운트될 때 성별에 맞는 오디오 소스 초기화
    audioRef.current = new Audio(getAudioSource(gender));

    audioRef.current.addEventListener("ended", () => {
      setIsPlaying(false)
      setProgress(0)
      cancelAnimationFrame(animationRef.current!)
      // 재생 종료 시 파형 높이를 초기 상태로 되돌림
      setWaveHeights(Array.from({ length: 60 }, () => Math.random() * 20 + 5)) // 파형 높이 범위를 이전으로 유지 (5px ~ 25px)
    })

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", () => {})
      }
    }
  }, [gender]) // gender prop이 변경될 때마다 useEffect를 다시 실행합니다.

  // 재생 상태에 따라 파형 높이 업데이트 (이전 코드를 제거하여 CSS 애니메이션에만 의존)
  const handlePlayPause = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(getAudioSource(gender));
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
        cancelAnimationFrame(animationRef.current!);
        setWaveHeights(Array.from({ length: 60 }, () => Math.random() * 20 + 5));
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    }

    setIsPlaying(!isPlaying);
  }

  const updateProgress = () => {
    if (audioRef.current) {
      const value = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(value)
      animationRef.current = requestAnimationFrame(updateProgress)
    }
  }

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`/placeholder.svg?height=48&width=48`} alt={name} />
              <AvatarFallback className={`bg-${colors[gender].secondary} text-${colors[gender].primary}`}>
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-onair-text">{name} AI 아나운서</h3>
                <Badge className={`bg-${colors[gender].secondary} text-${colors[gender].primary}`}>
                  {gender === "male" ? "남성" : "여성"}
                </Badge>
              </div>
              <p className="text-sm text-onair-text-sub">{title}</p>
            </div>
          </div>
          <Button
            onClick={handlePlayPause}
            className={`bg-${colors[gender].primary} hover:bg-${colors[gender].primary}/90 text-onair-bg`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-onair-text">{sampleText}</p>

          {/* 음성 파형 시각화 */}
          <div className="relative h-12 bg-onair-bg rounded-md overflow-hidden">
            {isClient ? (
              <div className="absolute inset-0 flex items-center justify-center space-x-1 px-2">
                {waveHeights.map((height, i) => (
                  <div
                    key={i}
                    className={`bg-${colors[gender].primary}/60 rounded-full transition-all duration-150 ${isPlaying ? "animate-wave" : ""}`}
                    style={{
                      height: `${height}px`,
                      width: "2px",
                      animationDelay: isPlaying ? `${i * 0.05}s` : "0s",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`bg-${colors[gender].primary}/60 rounded-full`}
                  style={{ height: "15px", width: "20px" }}
                />
              </div>
            )}

            {/* 진행 표시줄 */}
            <div
              className={`absolute bottom-0 left-0 h-1 bg-${colors[gender].primary}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* 파형 아래 안내 문구 */}
          <div className="mt-2 flex items-center text-xs text-onair-text-sub">
            <Volume2 className={`w-4 h-4 mr-2 text-${colors[gender].primary}`} />
            재생 버튼을 클릭하여 AI 음성을 들어보세요
          </div>
          {/* 파형 아래 구분선 */}
          <div className="border-t border-onair-text-sub/30 my-3" />
          {/* 파형 아래 설명 문구 */}
          <div className="text-xs text-onair-text-sub">
            {description}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}