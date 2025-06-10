"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, RotateCcw, Trophy, Star } from "lucide-react"

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

  const handleChallengeSelect = (challenge: (typeof challenges)[0]) => {
    setSelectedChallenge(challenge)
    onReset()
    currentChallengeRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleDifficultySelect = (difficulty: string | null) => {
    setSelectedDifficulty(difficulty)
    currentChallengeRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const filteredChallenges = selectedDifficulty
    ? challenges.filter((challenge) => challenge.difficulty === selectedDifficulty)
    : challenges

  const handleRandomChallenge = () => {
    const randomIndex = Math.floor(Math.random() * filteredChallenges.length)
    setSelectedChallenge(filteredChallenges[randomIndex])
    onReset()
  }

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

      {/* 랜덤 버튼 */}
      <Button
        onClick={handleRandomChallenge}
        className="w-full mb-4 bg-onair-orange hover:bg-onair-orange/90 text-white"
      >
        랜덤 챌린지 선택
      </Button>
      {/* 챌린지 선택 */}
      <Card className="bg-onair-bg-sub border-onair-text-sub/20">
        <CardHeader>
          <CardTitle className="text-onair-text flex items-center gap-2">
            <Trophy className="w-5 h-5 text-onair-orange" />
            발음 챌린지 선택
          </CardTitle>
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
      <Card ref={currentChallengeRef} className="bg-onair-bg-sub border-onair-text-sub/20">
        <CardHeader>
          <CardTitle className="text-onair-text flex items-center justify-between">
            <span>현재 챌린지</span>
            <Badge className={selectedChallenge.color}>{selectedChallenge.difficulty}</Badge>
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
            )}

            <div className="flex justify-center gap-4">
              <Button
                onClick={onRecord}
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

            {hasRecorded && <p className="text-onair-text-sub text-sm">AI가 발음을 분석하고 있습니다...</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
