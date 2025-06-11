"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Pencil, Volume2 } from "lucide-react";

interface SentenceCardProps {
  sentence: string
  onSentenceChange?: (newSentence: string) => void  // 문장 수정 콜백
  onRefresh?: () => void
  currentTab: string             // 현재 탭 정보를 props로 받기
}

export function SentenceCard({ sentence, onSentenceChange, onRefresh, currentTab }: SentenceCardProps) {
  const [waveformHeights, setWaveformHeights] = useState<number[]>([])
  const [isClient, setIsClient] = useState(false)

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
    setLocalSentence(e.target.value);
    if (onSentenceChange) onSentenceChange(e.target.value);
  }

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

      <CardContent>
        {/* 250609 박남규 - 훈련 문장을 직접 보여주고 수정 가능하도록 처리 */}
        <div className="p-6 bg-onair-bg rounded-lg border border-onair-text-sub/10">
          <textarea
            ref={textareaRef}
            className="w-full min-h-[8rem] resize-none bg-onair-bg text-onair-text text-lg leading-relaxed text-center rounded-md border border-onair-text-sub/20 p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            value={localSentence}
            onChange={handleSentenceChange}
            spellCheck={false}
            readOnly={currentTab !== 'custom'}
          />
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

