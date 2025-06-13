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
  const [waveHeights, setWaveHeights] = useState<number[]>(Array.from({ length: 50 }, () => 10))
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
    return currentGender === "female" ? "/audio/female.wav" : "/audio/male.wav";
  };

  // 클라이언트 마운트 시 isClient 설정 및 파형 높이 초기화
  useEffect(() => {
    setIsClient(true)
    // 초기 파형 높이 설정 (Math.random()이 클라이언트에서만 실행되도록)
    setWaveHeights(Array.from({ length: 50 }, () => 10 + Math.random() * 10))

    // AIVoiceShowcase 컴포넌트가 마운트될 때 성별에 맞는 오디오 소스 초기화
    audioRef.current = new Audio(getAudioSource(gender));

    audioRef.current.addEventListener("ended", () => {
      setIsPlaying(false)
      setProgress(0)
      cancelAnimationFrame(animationRef.current!)
      // 재생 종료 시 파형 높이를 초기 상태로 되돌림
      setWaveHeights(Array.from({ length: 50 }, () => 10 + Math.random() * 10))
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

  // 재생 상태에 따라 파형 높이 업데이트 (클라이언트에서만 실행)
  useEffect(() => {
    if (!isClient) return // 클라이언트가 아닌 경우 실행하지 않음

    let frameId: number | undefined

    const animateWaves = () => {
      setWaveHeights(prevHeights => {
        return prevHeights.map((_, i) => {
          if (isPlaying) {
            // 재생 중일 때 동적인 파형
            return 30 + Math.sin(Date.now() / 200 + i * 0.2) * 20
          } else {
            // 재생 중이 아닐 때 정적인 파형 (새로운 랜덤 값)
            return 10 + Math.random() * 10
          }
        })
      })
      frameId = requestAnimationFrame(animateWaves)
    }

    if (isPlaying) {
      frameId = requestAnimationFrame(animateWaves)
    } else {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId)
      }
      // 재생이 멈췄을 때 파형을 초기 랜덤 값으로 재설정
      setWaveHeights(Array.from({ length: 50 }, () => 10 + Math.random() * 10))
    }

    return () => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [isPlaying, isClient]) // isPlaying 또는 isClient가 변경될 때마다 실행

  const handlePlayPause = () => {
    // Audio 객체가 없거나, 현재 소스가 gender에 맞지 않으면 새로 생성합니다.
    const currentAudioSource = getAudioSource(gender);
    if (!audioRef.current || audioRef.current.src !== window.location.origin + currentAudioSource) {
      audioRef.current = new Audio(currentAudioSource);
      // 새로운 Audio 객체에 ended 이벤트 리스너 다시 연결
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
        cancelAnimationFrame(animationRef.current!);
        setWaveHeights(Array.from({ length: 50 }, () => 10 + Math.random() * 10));
      });
    }

    if (isPlaying) {
      audioRef.current.pause()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    } else {
      audioRef.current.play()
      animationRef.current = requestAnimationFrame(updateProgress)
    }

    setIsPlaying(!isPlaying)
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
            <div className="absolute inset-0 flex items-center justify-center space-x-1 px-2">
              {waveHeights.map((height, i) => (
                <div
                  key={i}
                  className={`bg-${colors[gender].primary}/60 rounded-full transition-all duration-100`}
                  style={{
                    height: `${height}%`,
                    width: "2px",
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>

            {/* 진행 표시줄 */}
            <div
              className={`absolute bottom-0 left-0 h-1 bg-${colors[gender].primary}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Volume2 className={`w-4 h-4 text-${colors[gender].primary}`} />
            <p className="text-xs text-onair-text-sub">
              {isPlaying ? "재생 중..." : "재생 버튼을 클릭하여 AI 음성을 들어보세요"}
            </p>
          </div>

          <div className="pt-3 border-t border-onair-text-sub/10">
            <p className="text-sm text-onair-text-sub">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
