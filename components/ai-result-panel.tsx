"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Lock, LogIn, Play, Pause } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { getAuthStatus } from "@/lib/auth-utils"
import { WaveformPlayer, type WaveformPlayerHandle } from "@/components/waveform-player"
import VoiceRadarChart from "@/components/voice-rader-chart"
import WaveCompare from "./WaveCompare"


// AI 분석 결과 타입 정의
interface AIAnalysisItem {
  metric: string
  score: number
  shortFeedback: string
  detailedFeedback: string[]
}

interface AIAnalysisResult {
  analysisId: string
  overallScore: number
  items: AIAnalysisItem[]
}

// VoiceComparisonPanel Props 타입
interface VoiceComparisonPanelProps {
  myVoiceUrl: string | null
  referenceUrl?: string | null
  userRecordingUrl?: string | null
  waveformRef?: React.RefObject<WaveformPlayerHandle | null>
  analysisResult?: AIAnalysisResult
}

// 기본 AI 분석 결과 데이터
export const defaultAIAnalysis: AIAnalysisResult = {
  "analysisId": "c3fcd3d76192e4007c1b2c8e14b0c0c8", 
  "overallScore": 78.67,
  "items": [
    {
      "metric": "pronunciation",
      "score": 71.00,
      "shortFeedback": "전체적인 발음이 명확합니다.",
      "detailedFeedback": [
        "발음이 전반적으로 정확하여 이해하는 데 어려움이 없습니다.",
        "하지만 몇몇 음절에서 소리가 묻히는 경향이 있으니 주의해 주세요."
      ]
    },
    {
      "metric": "pitch",
      "score": 52.70,
      "shortFeedback": "'습니다' 부분의 억양을 더 자연스럽게 해보세요.",
      "detailedFeedback": [
        "'습니다'의 억양에서 약간의 경직감이 느껴집니다." ,
        "자연스러운 억양을 위해 조금 더 부드럽게 조절하는 연습이 필요합니다."
      ]
    },
    {
      "metric": "stress",
      "score": 80.79,
      "shortFeedback": "문장 끝에서 톤을 살짝 낮춰보세요.",
      "detailedFeedback": [
        "강세 패턴이 잘 형성되어 있지만, 문장이 끝나는 부분에서 톤을 낮추면 더 자연스럽고 매끄러운 대화체가 될 것입니다."
      ]
    },
    {
      "metric": "speed",
      "score": 61.68,
      "shortFeedback": "발화 속도는 적절하나, 다소 느릴 수 있습니다.",
      "detailedFeedback": [
        "일부 구문에서는 발화 속도가 느리게 느껴질 수 있습니다.",
        "자연스러운 대화를 위해서는 적절히 템포를 조절하는 것이 중요합니다."
      ]
    },
    {
      "metric": "vowel",
      "score": 94.26,
      "shortFeedback": "모음 발음이 매우 뛰어납니다.",
      "detailedFeedback": [
        "모음 발음의 정확성이 인상적입니다.",
        "이러한 발음은 의사소통의 명확성을 높이는 데 큰 도움이 됩니다."
      ]
    },
    {
      "metric": "intonation",
      "score": 92.31,
      "shortFeedback": "억양의 변화가 잘 나타납니다.",
      "detailedFeedback": [
        "억양 패턴이 잘 형성되어 있어 감정이 잘 전달됩니다.", 
        "그러나 특정 부분에 강조를 더욱 뚜렷이 하는 연습이 필요합니다."
      ]
    },
    {
      "metric": "rhythm",
      "score": 95.89,
      "shortFeedback": "리듬이 뛰어납니다.",
      "detailedFeedback": [
        "리듬감이 매우 자연스러워, 청중이 쉽게 따라올 수 있습니다.",
        "이런 리듬감은 효과적인 전달에 큰 도움이 됩니다."
      ]
    },
    {
      "metric": "pause",
      "score": 94.95,
      "shortFeedback": "쉼표 패턴이 잘 나타납니다.",
      "detailedFeedback": [
        "쉼표가 적절히 사용되어 내용의 이해를 더욱 돕습니다.",
        "간혹 쉼표를 더 추가하거나 조정하면 긴 문장의 의미가 더욱 명확해질 수 있습니다."
      ]
    }
  ]
}

export function AIResultPanel({ myVoiceUrl, referenceUrl, userRecordingUrl, waveformRef, analysisResult = defaultAIAnalysis }: VoiceComparisonPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
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

  const analysisData = analysisResult || defaultAIAnalysis

  // 메트릭별 라벨 매핑
  const metricLabels = {
    pronunciation: "발음 정확도",
    pitch: "피치",
    stress: "강세",
    speed: "발화 속도",
    vowel: "모음 발음",
    intonation: "억양",
    rhythm: "리듬",
    pause: "쉼표 패턴",
  }

  // 피드백 타입 결정 함수
  const getFeedbackType = (score: number) => {
    if (score >= 90) return "good"
    if (score >= 70) return "improve"
    return "tip"
  }

  const handleLoginRedirect = () => {
    window.location.href = "/auth/login"
  }

  // 음성 비교 관련 함수들
  const tracks = [
    { id: "my", label: "파형 비교 분석", color: "onair-orange" },
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

  // 예시 점수 (실제 데이터로 대체)
  const scoreValues = analysisData.items ? [
    analysisData.items[0]?.score || 0,
    analysisData.items[1]?.score || 0,
    analysisData.items[2]?.score || 0,
    analysisData.items[3]?.score || 0,
    analysisData.items[4]?.score || 0,
    analysisData.items[5]?.score || 0,
    analysisData.items[6]?.score || 0,
    analysisData.items[7]?.score || 0,
  ] : [0, 0, 0, 0, 0, 0, 0, 0];

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20 relative">
      <CardHeader>
        <CardTitle className="text-onair-text">AI 분석 결과</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* 음성 비교 섹션 */}
        {isLoggedIn && (
          <div className="space-y-4">
            <h4 className="font-semibold text-onair-text">파형 비교 분석</h4>
            <WaveCompare
              audioFile1={referenceUrl || "/audio/female.wav"}
              audioFile2={userRecordingUrl || "/audio/male.wav"}
              label1="AI(정답) - 배경"
              label2="내 음성 - DTW 정렬됨"
            />
          </div>
        )}
        
        {/* 전체 점수 */}
        <div className="text-center p-4 bg-onair-bg rounded-lg border border-onair-text-sub/20">
          <div className="text-2xl font-bold text-onair-mint mb-1">
            {analysisData.overallScore.toFixed(1)}점
          </div>
          <div className="text-onair-text-sub text-sm">전체 평가 점수</div>
        </div>

        <h4 className="font-semibold text-onair-text">육각 그래프</h4>
        <VoiceRadarChart scores={scoreValues} />

        {/* 개별 점수
        <div className="grid grid-cols-2 gap-4">
          {analysisData.items.map((item) => {
            const getColor = (score: number) => {
              if (score >= 90) return "text-onair-mint"
              if (score >= 80) return "text-onair-orange"
              return "text-red-400"
            }

            return (
              <div key={item.metric} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-onair-text-sub text-sm">
                    {metricLabels[item.metric as keyof typeof metricLabels] || item.metric}
                  </span>
                  <span className={`font-semibold ${getColor(item.score)}`}>
                    {item.score.toFixed(1)}점
                  </span>
                </div>
                <Progress value={item.score} className="h-2" />
              </div>
            )
          })}
        </div> */}

        {/* 피드백 */}
        <div className="space-y-3">
          <h4 className="font-semibold text-onair-text">상세 피드백</h4>
          {analysisData.items.map((item, index) => {
            const feedbackType = getFeedbackType(item.score)
            const colors = {
              good: "bg-onair-mint/10 text-onair-mint border-onair-mint/20",
              improve: "bg-onair-orange/10 text-onair-orange border-onair-orange/20",
              tip: "bg-onair-blue/10 text-onair-blue border-onair-blue/20",
            }

            return (
              <div key={index} className={`p-3 rounded-lg border ${colors[feedbackType]}`}>
                <p className="text-sm font-medium mb-1">{item.shortFeedback}</p>
                {item.detailedFeedback.map((detail, detailIndex) => (
                  <p key={detailIndex} className="text-xs text-onair-text-sub">
                    {detail}
                  </p>
                ))}
              </div>
            )
          })}
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
              AI 분석 결과를 확인하려면 로그인해주세요
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
