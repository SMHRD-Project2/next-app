"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Pencil, Volume2, ChevronDown, Play, Pause, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { aiModels } from "@/components/ai-model-manager"

interface SentenceCardProps {
  sentence: string
  onSentenceChange?: (newSentence: string) => void  // 문장 수정 콜백
  onRefresh?: () => void
  currentTab: string             // 현재 탭 정보를 props로 받기
}

export function SentenceCard({ sentence, onSentenceChange, onRefresh, currentTab }: SentenceCardProps) {
  const [waveformHeights, setWaveformHeights] = useState<number[]>([])
  const [isClient, setIsClient] = useState(false)

  const MAX_LENGTH = 500;

  // 250609 박남규 - 내부 문장 상태를 따로 관리하도록 수정
  const [localSentence, setLocalSentence] = useState(sentence);

  // textarea 참조를 위한 ref 추가
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // localSentence가 변경될 때마다 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localSentence]);

  // 250609 박남규 - 부모 props sentence 변경 시 내부 상태 동기화
  useEffect(() => {
    setLocalSentence(sentence);
  }, [sentence]);

  useEffect(() => {
    // 클라이언트 마운트 확인
    setIsClient(true)
    // 클라이언트 사이드에서만 랜덤 값 생성
    const heights = Array.from({ length: 40 }, () => Math.random() * 30 + 10)
    setWaveformHeights(heights)
  }, [])

  // 250609 박남규 - textarea onChange 핸들러에서 내부 상태 및 부모 콜백 호출
  const handleSentenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputText = e.target.value;
    const truncatedText = inputText.slice(0, MAX_LENGTH);
    setLocalSentence(truncatedText);
    if (onSentenceChange) onSentenceChange(truncatedText);
  }

  const [selectedModel, setSelectedModel] = useState<number | null>(aiModels[0]?.id || null) // 기본 모델 설정 또는 첫 번째 모델 선택
  const [playingModel, setPlayingModel] = useState<number | null>(null)

  const handlePlayExample = async () => {
    if (!selectedModel) return

    try {
      setIsPlaying(true)
      const model = aiModels.find(m => m.id === selectedModel)
      if (!model) return

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: localSentence,
          modelId: model.id,
        }),
      })

      if (!response.ok) throw new Error('TTS 요청 실패')

      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
      
      audio.play()
    } catch (error) {
      console.error('TTS 처리 중 오류:', error)
      setIsPlaying(false)
    }
  }

  const [isPlaying, setIsPlaying] = useState(false);

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

            {/* 통합된 AI 예시 듣기 Split Button Dropdown */}
            <div className="inline-flex rounded-md shadow-sm border border-onair-mint"> {/* 전체 박스의 테두리 */}
              <Button
                variant="ghost" // 버튼의 기본 배경과 테두리를 제거
                size="sm"
                className="relative inline-flex items-center rounded-l-md rounded-r-none border-r border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg focus:z-10 focus:outline-none focus:ring-1 focus:ring-onair-mint"
                onClick={handlePlayExample}
              >
                {playingModel === selectedModel ? <Pause className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                AI 예시 듣기
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost" // 버튼의 기본 배경과 테두리를 제거
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
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* 250609 박남규 - 훈련 문장을 직접 보여주고 수정 가능하도록 처리 */}
        <div className="p-6 bg-onair-bg rounded-lg border border-onair-text-sub/10">
          <textarea
            ref={textareaRef}
            className="w-full min-h-[8rem] resize-none bg-onair-bg text-onair-text text-lg leading-relaxed text-center rounded-md border border-onair-text-sub/20 p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            value={localSentence}
            onChange={handleSentenceChange}
            spellCheck={false}
            readOnly={currentTab !== 'custom' || isPlaying}
            maxLength={MAX_LENGTH}
          />
          <p className="text-sm text-onair-text-sub text-right">
            {localSentence.length}/500
          </p>
        </div>

        {/* 250609 박남규 - 예시 음성 시각화 */}
        <div className="flex items-center justify-center space-x-1 h-12 bg-onair-bg rounded-lg p-2">
          {isClient && waveformHeights.length > 0 ? (
            waveformHeights.map((height, i) => (
              <div
                key={i}
                className="bg-onair-mint/60 rounded-full animate-wave"
                style={{
                  width: "3px",
                  height: `${height}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))
          ) : (
            // SSR 및 초기 로딩 시 정적 높이 사용
            Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="bg-onair-mint/60 rounded-full animate-wave"
                style={{
                  width: "3px",
                  height: "20px", // 고정 높이
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

