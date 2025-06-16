"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, RotateCcw, Trophy, Star, ChevronDown, Play, Pause, Volume2, Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { aiModels } from "@/components/ai-model-manager"
import { LoadingMessage } from "@/components/loading-message"
import { WaveformPlayer, WaveformPlayerHandle } from "@/components/waveform-player"
import { VoiceComparisonPanel } from "@/components/voice-comparison-panel"

interface PronunciationChallengeProps {
  isRecording: boolean
  onRecord: () => void
  hasRecorded: boolean
  onReset: () => void
}

const challenges = [
  {
    id: 1,
    text: "간장공장공장장",
    difficulty: "초급",
    description: "ㄱ과 ㅇ 발음의 정확한 구분",
    tips: "각 글자를 천천히 구분하여 발음하세요",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  {
    id: 2,
    text: "경찰청철창살",
    difficulty: "초급",
    description: "ㅊ과 ㅅ 발음의 명확한 차이",
    tips: "혀의 위치를 정확히 조절하여 발음하세요",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  {
    id: 3,
    text: "저기 계신 저 분이 박 법무부 장관이시다",
    difficulty: "중급",
    description: "받침과 연음의 정확한 처리",
    tips: "받침을 명확히 하고 자연스러운 연음을 만드세요",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  {
    id: 4,
    text: "신라면 라면신라 신라라면 라면라신",
    difficulty: "중급",
    description: "ㄴ과 ㄹ 발음의 정확한 구분",
    tips: "혀끝의 움직임에 집중하여 발음하세요",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  {
    id: 5,
    text: "앞집 팥죽은 붉은 팥 팥죽이고 뒷집 콩죽은 검은 콩 콩죽이다",
    difficulty: "고급",
    description: "복잡한 받침과 연음의 종합 처리",
    tips: "문장의 리듬감을 살려 자연스럽게 발음하세요",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  {
    id: 6,
    text: "내가 그린 기린 그림은 목이 긴 기린 그림이고 네가 그린 기린 그림은 목이 짧은 기린 그림이다",
    difficulty: "고급",
    description: "긴 문장에서의 발음 일관성 유지",
    tips: "호흡을 조절하며 끝까지 명확하게 발음하세요",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
  },
]

export function PronunciationChallenge({ isRecording, onRecord, hasRecorded, onReset }: PronunciationChallengeProps) {
  const [selectedChallenge, setSelectedChallenge] = useState(challenges[0])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const currentChallengeRef = useRef<HTMLDivElement>(null)
  const [selectedModel, setSelectedModel] = useState<number | null>(aiModels[0]?.id || null)
  const [playingModel, setPlayingModel] = useState<number | null>(null)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const waveformRef = useRef<WaveformPlayerHandle>(null)

  const handleChallengeSelect = (challenge: (typeof challenges)[0]) => {
    setSelectedChallenge(challenge)
    onReset()
    currentChallengeRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleDifficultySelect = (difficulty: string | null) => {
    setSelectedDifficulty(difficulty)
  }

  const filteredChallenges = selectedDifficulty
    ? challenges.filter((challenge) => challenge.difficulty === selectedDifficulty)
    : challenges

  const handleRandomChallenge = () => {
    const randomIndex = Math.floor(Math.random() * filteredChallenges.length)
    setSelectedChallenge(filteredChallenges[randomIndex])
    onReset()
  }

  const handlePlayExample = () => {
    if (selectedModel) {
      if (playingModel === selectedModel) {
        // 일시정지
        audio?.pause();
        setPlayingModel(null);
      } else {
        // 재생
        if (audio) {
          // 이전에 재생하던 오디오가 있다면 그 지점부터 재생
          audio.play();
          setPlayingModel(selectedModel);
        } else {
          // 국태은 추가 아나운서 녹음 파일 재생
          const newAudio = new Audio(`/audio/female.wav`);
          newAudio.play();
          setAudio(newAudio);
          setPlayingModel(selectedModel);
          
          // 재생이 끝나면 상태 초기화
          newAudio.onended = () => {
            setPlayingModel(null);
            setAudio(null);
          };
        }
      }
    }
  }

  // 녹음 시작/중지 처리
  const handleRecord = async () => {
    if (!isRecording) {
      try {
        let audioStream: MediaStream;
        
        try {
          // 먼저 실제 마이크로 시도
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
          console.log("마이크 접근 실패, 가상 오디오 스트림 생성 시도");
          // 마이크 접근 실패 시 가상 오디오 스트림 생성
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const destination = audioContext.createMediaStreamDestination();
          oscillator.connect(destination);
          oscillator.start();
          audioStream = destination.stream;
        }

        let mimeType = 'audio/webm;codecs=opus'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm'
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4'
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = '' // 브라우저 기본값 사용
            }
          }
        }

        const mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined)
        
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType || 'audio/webm'
          })
          
          if (audioURL) {
            URL.revokeObjectURL(audioURL)
          }
          
          const url = URL.createObjectURL(audioBlob)
          setAudioURL(url)
          audioChunksRef.current = []

          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          setRecordingTime(0)
        }

        mediaRecorder.start()
        onRecord()
        
        setRecordingTime(0)
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } catch (err) {
        console.error('녹음 권한을 얻을 수 없습니다:', err)
        alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 확인해주세요.')
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      onRecord()
    }
  }

  // 녹음된 오디오 재생
  const handlePlay = async () => {
    if (audioURL) {
      try {
        if (isPlaying) {
          waveformRef.current?.pause()
          setIsPlaying(false)
        } else {
          waveformRef.current?.play()
          setIsPlaying(true)
        }
      } catch (err) {
        console.error('재생 오류:', err)
        setIsPlaying(false)
      }
    }
  }

  // 녹음 파일 다운로드
  const handleDownload = () => {
    if (audioURL) {
      const a = document.createElement('a')
      a.href = audioURL
      a.download = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  return (
    <div className="space-y-6">
      {/* 난이도 필터 버튼 */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedDifficulty === null ? "default" : "outline"}
          onClick={() => handleDifficultySelect(null)}
          className="flex-1"
        >
          전체
        </Button>
        <Button
          variant={selectedDifficulty === "초급" ? "default" : "outline"}
          onClick={() => handleDifficultySelect("초급")}
          className="flex-1"
        >
          초급
        </Button>
        <Button
          variant={selectedDifficulty === "중급" ? "default" : "outline"}
          onClick={() => handleDifficultySelect("중급")}
          className="flex-1"
        >
          중급
        </Button>
        <Button
          variant={selectedDifficulty === "고급" ? "default" : "outline"}
          onClick={() => handleDifficultySelect("고급")}
          className="flex-1"
        >
          고급
        </Button>
      </div>

      {/* 챌린지 선택 */}
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
                    {selectedChallenge.id === challenge.id && <Star className="w-4 h-4 text-onair-mint fill-current" />}
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

      {/* 선택된 챌린지 */}
      <Card ref={currentChallengeRef} className="bg-onair-bg-sub border-onair-text-sub/220">
        <CardHeader>
          <CardTitle className="text-onair-text flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>현재 챌린지</span>
              <Badge className={selectedChallenge.color}>{selectedChallenge.difficulty}</Badge>
            </div>
            <div className="inline-flex rounded-md shadow-sm border border-onair-mint">
              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center rounded-l-md rounded-r-none border-r border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg focus:z-10 focus:outline-none focus:ring-1 focus:ring-onair-mint"
                onClick={handlePlayExample}
              >
                {playingModel === selectedModel ? <Pause className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {selectedModel ? aiModels.find(model => model.id === selectedModel)?.name : 'AI 예시 듣기'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative inline-flex items-center rounded-r-md rounded-l-none text-onair-mint hover:bg-onair-mint hover:text-onair-bg px-2 focus:z-10 focus:outline-none focus:ring-1 focus:ring-onair-mint"
                    aria-label="AI 모델 선택"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {aiModels.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        if (playingModel !== null) {
                          setPlayingModel(null);
                        }
                      }}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={model.avatar} />
                        <AvatarFallback className="bg-onair-bg text-onair-mint">
                          {model.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-onair-text-sub">{model.type}</span>
                      </div>
                      {selectedModel === model.id && (
                        <span className="ml-auto text-onair-mint">✓</span>
                      )}
                      {model.isDefault && selectedModel !== model.id && (
                        <Star className="w-4 h-4 text-onair-orange fill-current ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-onair-bg rounded-lg border border-onair-text-sub/10">
            <p className="text-lg leading-relaxed text-onair-text text-center font-medium">{selectedChallenge.text}</p>
          </div>

          <div className="bg-onair-bg/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-onair-mint">🎯 포인트: {selectedChallenge.description}</p>
            <p className="text-sm text-onair-text-sub">💡 팁: {selectedChallenge.tips}</p>
          </div>

          {/* 녹음 컨트롤 */}
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-onair-text">
              {isRecording ? "녹음 중..." : hasRecorded ? "녹음 완료!" : "음성 녹음"}
            </h3>

            {isRecording && (
              <>
                <div className="flex items-center justify-center space-x-1 h-16">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-onair-orange rounded-full animate-wave"
                      style={{
                        width: "4px",
                        height: `${Math.random() * 40 + 20}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-onair-text-sub text-sm mt-2">
                  {` ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`}
                </p>
              </>
            )}

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleRecord}
                size="lg"
                className={`${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
                } font-semibold`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-5 h-5 mr-2" />
                    녹음 중지
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    {hasRecorded ? "다시 녹음" : "녹음 시작"}
                  </>
                )}
              </Button>

              {hasRecorded && !isRecording && audioURL && (
                <div className="flex gap-2">
                  <Button
                    onClick={handlePlay}
                    size="lg"
                    variant="outline"
                    className="border-onair-blue text-onair-blue hover:bg-onair-blue hover:text-onair-bg"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                    {isPlaying ? "일시정지" : "재생"}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    size="lg"
                    variant="outline"
                    className="border-onair-blue text-onair-blue hover:bg-onair-blue hover:text-onair-bg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    다운로드
                  </Button>
                </div>
              )}

              {hasRecorded && (
                <Button
                  onClick={onReset}
                  size="lg"
                  variant="outline"
                  className="border-onair-blue text-onair-blue hover:bg-onair-blue hover:text-onair-bg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  다시 도전
                </Button>
              )}
            </div>

            {hasRecorded && !isRecording && <LoadingMessage />}
          </div>
        </CardContent>
      </Card>

      {/* 음성 비교 분석 패널 */}
      <VoiceComparisonPanel myVoiceUrl={audioURL} waveformRef={waveformRef} />
    </div>
  )
}