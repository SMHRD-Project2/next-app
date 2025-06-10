"use client"

import { useEffect, useState } from "react"
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

  // 250609 박남규 - 수정 모드 상태 추가
  const [isEditing, setIsEditing] = useState(false);

  // 250609 박남규 - 내부 문장 상태를 따로 관리하도록 수정
  const [localSentence, setLocalSentence] = useState(sentence);

  // 250609 박남규 - 부모 props sentence 변경 시 내부 상태 동기화
  useEffect(() => {
    setLocalSentence(sentence);
  }, [sentence]);

  useEffect(() => {
    // 클라이언트 사이드에서만 랜덤 값 생성
    const heights = Array.from({ length: 40 }, () => Math.random() * 30 + 10)
    setWaveformHeights(heights)
  }, [])

  // 250609 박남규 - 수정 버튼 클릭 시 수정 모드 토글 함수
  const handleEditClick = () => {
    setIsEditing(prev => !prev)
  }

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
              currentTab === "custom" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg"
                  onClick={handleEditClick}  // 250609 박남규 - 수정 버튼 클릭 시 수정 모드 토글
                  aria-label="문장 수정"
                  title={isEditing ? "수정 완료" : "문장 수정하기"}  // 상태에 따라 버튼 툴팁 변경
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              ) : (
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
              )
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

      <CardContent className="space-y-4">
        {/* 250609 박남규 - 훈련 문장을 직접 보여주고 수정 가능하도록 처리 */}
        <div className="p-6 bg-onair-bg rounded-lg border border-onair-text-sub/10">
          <textarea
            className="w-full h-32 resize-none bg-onair-bg text-onair-text text-lg leading-relaxed text-center rounded-md border border-onair-text-sub/20 p-4"
            value={localSentence}                         // 250609 박남규 - 내부 상태 사용
            onChange={handleSentenceChange}               // 250609 박남규 - 수정 시 내부 상태 및 부모 콜백 호출
            spellCheck={false}
            readOnly={!isEditing}                          // 250609 박남규 - 수정 모드가 아닐 땐 읽기 전용
            style={{ cursor: isEditing ? "text" : "default" }} // 250609 박남규 - 커서 변경
          />
        </div>

        {/* 250609 박남규 - 예시 음성 시각화 */}
        <div className="flex items-center justify-center space-x-1 h-12 bg-onair-bg rounded-lg p-2">
          {
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
          }
        </div>
      </CardContent>
    </Card>
  )
}
