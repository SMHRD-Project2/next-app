"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, RefreshCw, Trophy, Star, ChevronDown, Play, Pause, Volume2, MessageSquare } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAIModels } from "@/lib/ai-model-context"
import { LoadingMessage } from "@/components/loading-message"
import { WaveformPlayer, WaveformPlayerHandle } from "@/components/waveform-player"
import { VoiceComparisonPanel } from "@/components/voice-comparison-panel"
import { getAuthStatus } from "@/lib/auth-utils"
import { SentenceCard } from "@/components/sentence-card"

interface Challenge {
  id: number
  text: string
  difficulty: string
  description: string
  tips: string
  color: string
  challengeAudioUrls: {
    [key: string]: {
      [key: string]: string;
    };
  };
  onAnalysisComplete?: (analysisResult: any, referenceUrl?: string, userRecordingUrl?: string) => void
}

interface PronunciationChallengeProps {
  isRecording: boolean
  onRecord: () => void
  hasRecorded: boolean
  onReset: () => void
  onAnalysisComplete?: (
    analysisResult: any,
    referenceUrl?: string,
    userRecordingUrl?: string
  ) => void
}

const challenges: Challenge[] = [
  {
    id: 1,
    text: "간장공장공장장",
    difficulty: "초급",
    description: "ㄱ과 ㅇ 발음의 정확한 구분",
    tips: "각 글자를 천천히 구분하여 발음하세요",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    challengeAudioUrls: {
      "간장공장공장장": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(1).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(1).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(1).wav"
      }
    }
  },
  {
    id: 2,
    text: "경찰청철창살",
    difficulty: "초급",
    description: "ㅊ과 ㅅ 발음의 명확한 차이",
    tips: "혀의 위치를 정확히 조절하여 발음하세요",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    challengeAudioUrls: {
      "경찰청철창살": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(2).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(2).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(2).wav"
      }
    }
  },
  {
    id: 3,
    text: "저기 계신 저 분이 박 법무부 장관이시다",
    difficulty: "중급",
    description: "받침과 연음의 정확한 처리",
    tips: "받침을 명확히 하고 자연스러운 연음을 만드세요",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    challengeAudioUrls: {
      "저기 계신 저 분이 박 법무부 장관이시다": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(3).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(3).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(3).wav"
      }
    }
  },
  {
    id: 4,
    text: "신라면 라면신라 신라라면 라면라신",
    difficulty: "중급",
    description: "ㄴ과 ㄹ 발음의 정확한 구분",
    tips: "혀끝의 움직임에 집중하여 발음하세요",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    challengeAudioUrls: {
      "신라면 라면신라 신라라면 라면라신": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(4).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(4).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(4).wav"
      }
    }
  },
  {
    id: 5,
    text: "앞집 팥죽은 붉은 팥 팥죽이고 뒷집 콩죽은 검은 콩 콩죽이다",
    difficulty: "고급",
    description: "복잡한 받침과 연음의 종합 처리",
    tips: "문장의 리듬감을 살려 자연스럽게 발음하세요",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    challengeAudioUrls: {
      "앞집 팥죽은 붉은 팥 팥죽이고 뒷집 콩죽은 검은 콩 콩죽이다": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(5).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(5).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(5).wav"
      }
    }
  },
  {
    id: 6,
    text: "내가 그린 기린 그림은 목이 긴 기린 그림이고 네가 그린 기린 그림은 목이 짧은 기린 그림이다",
    difficulty: "고급",
    description: "긴 문장에서의 발음 일관성 유지",
    tips: "호흡을 조절하며 끝까지 명확하게 발음하세요",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    challengeAudioUrls: {
      "내가 그린 기린 그림은 목이 긴 기린 그림이고 네가 그린 기린 그림은 목이 짧은 기린 그림이다": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(6).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(6).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(6).wav"
      }
    }
  }
]

export function PronunciationChallenge({
  isRecording,
  onRecord,
  hasRecorded,
  onReset,
  onAnalysisComplete
}: PronunciationChallengeProps) {
  const [selectedChallenge, setSelectedChallenge] = useState(challenges[0])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const currentChallengeRef = useRef<HTMLDivElement>(null)
  const [selectedModel, setSelectedModel] = useState<number | null>(null)
  const [playingModel, setPlayingModel] = useState<number | null>(null)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const waveformRef = useRef<WaveformPlayerHandle | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)  // 녹음된 오디오 재생용
  const exampleAudioRef = useRef<HTMLAudioElement | null>(null)  // AI 예시 음성 재생용
  const headerControlsRef = useRef<HTMLDivElement>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedRecordingUrl, setUploadedRecordingUrl] = useState<string | null>(null)
  const [waveformHeights, setWaveformHeights] = useState<number[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const filteredChallenges = selectedDifficulty
    ? challenges.filter((c) => c.difficulty === selectedDifficulty)
    : challenges

  const handleChallengeSelect = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    onReset()
    currentChallengeRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleRandomChallenge = () => {
    const randomIndex = Math.floor(Math.random() * filteredChallenges.length)
    setSelectedChallenge(filteredChallenges[randomIndex])
    onReset()
  }

  const voiceUrl1 = selectedChallenge.challengeAudioUrls[selectedChallenge.text]?.["김주하"]
  const voiceUrl2 = selectedChallenge.challengeAudioUrls[selectedChallenge.text]?.["이동욱"]
  const voiceUrl3 = selectedChallenge.challengeAudioUrls[selectedChallenge.text]?.["박소현"]

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedDifficulty === null ? "default" : "outline"}
          onClick={() => setSelectedDifficulty(null)}
          className="flex-1"
        >
          전체
        </Button>
        <Button
          variant={selectedDifficulty === "초급" ? "default" : "outline"}
          onClick={() => setSelectedDifficulty("초급")}
          className="flex-1"
        >
          초급
        </Button>
        <Button
          variant={selectedDifficulty === "중급" ? "default" : "outline"}
          onClick={() => setSelectedDifficulty("중급")}
          className="flex-1"
        >
          중급
        </Button>
        <Button
          variant={selectedDifficulty === "고급" ? "default" : "outline"}
          onClick={() => setSelectedDifficulty("고급")}
          className="flex-1"
        >
          고급
        </Button>
      </div>

      <Card className="bg-onair-bg-sub border-onair-text-sub/20">
        <CardHeader>
          <CardTitle className="text-onair-text flex items-center gap-2">
            <Trophy className="w-5 h-5 text-onair-orange" />
            발음 챌린지 선택
          </CardTitle>
          <p>어려운 발음에 도전하여 실력을 한 단계 업그레이드하세요</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedChallenge.id === challenge.id
                    ? "border-onair-mint bg-onair-mint/10"
                    : "border-onair-text-sub/20 bg-onair-bg hover:bg-onair-bg-sub"
                }`}
                onClick={() => handleChallengeSelect(challenge)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={challenge.color}>{challenge.difficulty}</Badge>
                    {selectedChallenge.id === challenge.id && (
                      <Star className="w-4 h-4 text-onair-mint fill-current" />
                    )}
                  </div>
                </div>
                <p className="text-onair-text font-medium mb-1">{challenge.text}</p>
                <p className="text-sm text-onair-text-sub mb-1">{challenge.description}</p>
                <p className="text-xs text-onair-text-sub italic">💡 {challenge.tips}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card ref={currentChallengeRef} className="bg-onair-bg-sub border-onair-text-sub/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-onair-text flex items-center gap-2">
              <span>현재 챌린지</span>
              <Badge className={selectedChallenge.color}>{selectedChallenge.difficulty}</Badge>
            </CardTitle>
            <div ref={headerControlsRef} className="flex items-center space-x-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-onair-bg rounded-lg border border-onair-text-sub/10">
            <p className="text-lg leading-relaxed text-onair-text text-center font-medium">
              {selectedChallenge.text}
            </p>
          </div>

          <div className="bg-onair-bg/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-onair-mint">🎯 포인트: {selectedChallenge.description}</p>
            <p className="text-sm text-onair-text-sub">💡 팁: {selectedChallenge.tips}</p>
          </div>

          <SentenceCard
            sentence={selectedChallenge.text}
            voiceUrl1={voiceUrl1}
            voiceUrl2={voiceUrl2}
            voiceUrl3={voiceUrl3}
            onSentenceChange={() => {}}
            onRefresh={handleRandomChallenge}
            currentTab="challenge"
            isRecording={isRecording}
            onRecord={onRecord}
            hasRecorded={hasRecorded}
            onNext={handleRandomChallenge}
            canNext={false}
            waveformRef={waveformRef}
            onRecordingComplete={() => {}}
            onAnalysisComplete={onAnalysisComplete}
            noCard
            hideTitle
            showSentenceBox={false}
            headerPortalRef={headerControlsRef}
          />
        </CardContent>
      </Card>
    </div>
  )
}