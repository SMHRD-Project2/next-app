"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SentenceCard } from "@/components/sentence-card"
import { RecordController } from "@/components/record-controller"
import { AIResultPanel } from "@/components/ai-result-panel"
import { VoiceComparisonPanel } from "@/components/voice-comparison-panel"
import { CustomSentenceUpload } from "@/components/custom-sentence-upload"
import { PronunciationChallenge } from "@/components/pronunciation-challenge"

const trainingData = {
  short: {
    title: "짧은 문장",
    sentences: ["안녕하세요, 시청자 여러분.", "오늘 날씨가 참 좋습니다.", "뉴스를 전해드리겠습니다."],
  },
  long: {
    title: "긴 문장",
    sentences: [
      "오늘 서울 지역에 첫눈이 내렸으며, 기상청은 내일까지 눈이 계속될 것으로 예보했습니다.",
      "정부는 새로운 경제 정책을 발표하며, 이를 통해 국민들의 생활이 개선될 것으로 기대한다고 밝혔습니다.",
    ],
  },
  news: {
    title: "뉴스 읽기",
    sentences: [
      "다음은 경제 뉴스입니다. 오늘 코스피 지수는 전 거래일 대비 1.2% 상승한 2,450포인트로 마감했습니다.",
      "국제 유가가 상승세를 보이면서 에너지 관련 주식들이 강세를 나타냈습니다.",
    ],
  },
}

export function TrainingTabs() {
  const [activeTab, setActiveTab] = useState("short")
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [customSentence, setCustomSentence] = useState("")

  const currentData = trainingData[activeTab as keyof typeof trainingData]
  const currentSentence = activeTab === "custom" ? customSentence : currentData?.sentences[currentSentenceIndex]

  const handleRecord = () => {
    setIsRecording(!isRecording)
    if (isRecording) {
      setHasRecorded(true)
    }
  }

  const handleNextSentence = () => {
    if (currentData && currentSentenceIndex < currentData.sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1)
      setHasRecorded(false)
    }
  }

  const handleCustomSentenceSelect = (sentence: string) => {
    setCustomSentence(sentence)
    setHasRecorded(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-onair-bg-sub">
          <TabsTrigger value="short" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">
            짧은 문장
          </TabsTrigger>
          <TabsTrigger value="long" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">
            긴 문장
          </TabsTrigger>
          <TabsTrigger value="news" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">
            뉴스 읽기
          </TabsTrigger>
          <TabsTrigger value="custom" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">
            내문장 업로드
          </TabsTrigger>
          <TabsTrigger
            value="challenge"
            className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg"
          >
            발음 챌린지
          </TabsTrigger>
        </TabsList>

        {/* 기존 탭들 */}
        {Object.entries(trainingData).map(([key, data]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-onair-text mb-2">{data.title}</h2>
              <p className="text-onair-text-sub">
                문장 {currentSentenceIndex + 1} / {data.sentences.length}
              </p>
            </div>

            <SentenceCard sentence={currentSentence} />

            <RecordController
              isRecording={isRecording}
              onRecord={handleRecord}
              hasRecorded={hasRecorded}
              onNext={handleNextSentence}
              canNext={currentSentenceIndex < data.sentences.length - 1}
            />

            {hasRecorded && (
              <div className="space-y-6">
                <AIResultPanel />
                <VoiceComparisonPanel />
              </div>
            )}
          </TabsContent>
        ))}

        {/* 내문장 업로드 탭 */}
        <TabsContent value="custom" className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-onair-text mb-2">내문장 업로드</h2>
            <p className="text-onair-text-sub">원하는 문장을 업로드하여 맞춤형 훈련을 시작하세요</p>
          </div>

          <CustomSentenceUpload onSentenceSelect={handleCustomSentenceSelect} />

          {customSentence && (
            <>
              <SentenceCard sentence={customSentence} />

              <RecordController
                isRecording={isRecording}
                onRecord={handleRecord}
                hasRecorded={hasRecorded}
                onNext={() => {}}
                canNext={false}
              />

              {hasRecorded && (
                <div className="space-y-6">
                  <AIResultPanel />
                  <VoiceComparisonPanel />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* 발음 챌린지 탭 */}
        <TabsContent value="challenge" className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-onair-text mb-2">발음 챌린지</h2>
            <p className="text-onair-text-sub">어려운 발음에 도전하여 실력을 한 단계 업그레이드하세요</p>
          </div>

          <PronunciationChallenge
            isRecording={isRecording}
            onRecord={handleRecord}
            hasRecorded={hasRecorded}
            onReset={() => setHasRecorded(false)}
          />

          {hasRecorded && (
            <div className="space-y-6">
              <AIResultPanel />
              <VoiceComparisonPanel />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
