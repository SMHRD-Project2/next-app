"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Mic, Play, Square, CheckCircle, Wand2 } from "lucide-react"

export function VoiceCloningStudio() {
  const [step, setStep] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedSamples, setRecordedSamples] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [modelName, setModelName] = useState("")
  const [modelDescription, setModelDescription] = useState("")

  const sampleTexts = [
    "안녕하세요, 저는 AI 음성 모델 생성을 위한 샘플 음성을 녹음하고 있습니다.",
    "오늘은 날씨가 정말 좋네요. 맑은 하늘과 따뜻한 햇살이 기분을 좋게 만듭니다.",
    "뉴스를 전해드리겠습니다. 오늘 주요 경제 지표가 발표되었습니다.",
    "교육은 미래를 만드는 가장 중요한 투자입니다. 꾸준한 학습이 성공의 열쇠입니다.",
    "기술의 발전은 우리 삶을 더욱 편리하게 만들어주고 있습니다.",
  ]

  const handleRecord = (index: number) => {
    setIsRecording(!isRecording)
    if (isRecording) {
      // 녹음 완료 처리
      const newSamples = [...recordedSamples]
      newSamples[index] = `sample_${index + 1}.wav`
      setRecordedSamples(newSamples)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newSamples = Array.from(files).map((file) => file.name)
      setRecordedSamples([...recordedSamples, ...newSamples])
    }
  }

  const handleCreateModel = async () => {
    if (!modelName.trim()) {
      alert("모델 이름을 입력해주세요.")
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)

    // 진행률 시뮬레이션
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          setStep(4) // 완료 단계로 이동
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 500)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="bg-onair-bg-sub border-onair-text-sub/20">
            <CardHeader>
              <CardTitle className="text-onair-text flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-onair-mint" />
                1단계: 음성 샘플 수집
              </CardTitle>
              <p className="text-onair-text-sub">고품질 AI 모델 생성을 위해 최소 5개의 음성 샘플이 필요합니다.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="record" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-onair-bg">
                  <TabsTrigger
                    value="record"
                    className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg"
                  >
                    직접 녹음
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg"
                  >
                    파일 업로드
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="record" className="space-y-4">
                  <div className="bg-onair-bg/50 rounded-lg p-4">
                    <h4 className="font-medium text-onair-text mb-2">녹음 가이드</h4>
                    <ul className="text-sm text-onair-text-sub space-y-1">
                      <li>• 조용한 환경에서 녹음해주세요</li>
                      <li>• 마이크와 30cm 정도 거리를 유지하세요</li>
                      <li>• 자연스럽고 일정한 속도로 읽어주세요</li>
                      <li>• 각 문장을 3-5초 정도로 녹음하세요</li>
                    </ul>
                  </div>

                  {sampleTexts.map((text, index) => (
                    <div key={index} className="p-4 bg-onair-bg rounded-lg border border-onair-text-sub/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-onair-mint">샘플 {index + 1}</span>
                        {recordedSamples[index] && <CheckCircle className="w-4 h-4 text-green-400" />}
                      </div>
                      <p className="text-onair-text mb-3">{text}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRecord(index)}
                          className={
                            isRecording
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
                          }
                        >
                          {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                        {recordedSamples[index] && (
                          <Button size="sm" variant="outline" className="border-onair-blue text-onair-blue">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed border-onair-text-sub/20 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-onair-text-sub mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-onair-text mb-2">음성 파일 업로드</h3>
                    <p className="text-onair-text-sub mb-4">WAV, MP3, M4A 파일을 드래그하거나 클릭하여 업로드하세요</p>
                    <Input
                      type="file"
                      multiple
                      accept=".wav,.mp3,.m4a"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="voice-upload"
                    />
                    <Label htmlFor="voice-upload">
                      <Button className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg">파일 선택</Button>
                    </Label>
                  </div>

                  {recordedSamples.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-onair-text">업로드된 파일</h4>
                      {recordedSamples.map((sample, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-onair-bg rounded">
                          <span className="text-onair-text-sub">{sample}</span>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-between items-center pt-4 border-t border-onair-text-sub/10">
                <div className="text-sm text-onair-text-sub">진행률: {recordedSamples.length}/5 샘플 완료</div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={recordedSamples.length < 5}
                  className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
                >
                  다음 단계
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card className="bg-onair-bg-sub border-onair-text-sub/20">
            <CardHeader>
              <CardTitle className="text-onair-text">2단계: 모델 정보 설정</CardTitle>
              <p className="text-onair-text-sub">생성할 AI 모델의 기본 정보를 입력해주세요.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model-name" className="text-onair-text">
                  모델 이름 *
                </Label>
                <Input
                  id="model-name"
                  placeholder="예: 내 목소리 모델"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="bg-onair-bg border-onair-text-sub/20 text-onair-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-description" className="text-onair-text">
                  모델 설명
                </Label>
                <Textarea
                  id="model-description"
                  placeholder="이 모델에 대한 간단한 설명을 입력하세요..."
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  className="bg-onair-bg border-onair-text-sub/20 text-onair-text"
                />
              </div>

              <div className="bg-onair-bg/50 rounded-lg p-4">
                <h4 className="font-medium text-onair-text mb-2">수집된 음성 샘플</h4>
                <div className="grid grid-cols-2 gap-2">
                  {recordedSamples.map((sample, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-onair-text-sub">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>샘플 {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-onair-text-sub/10">
                <Button variant="outline" onClick={() => setStep(1)} className="border-onair-text-sub/20">
                  이전 단계
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!modelName.trim()}
                  className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
                >
                  모델 생성 시작
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card className="bg-onair-bg-sub border-onair-text-sub/20">
            <CardHeader>
              <CardTitle className="text-onair-text">3단계: AI 모델 생성 중</CardTitle>
              <p className="text-onair-text-sub">AI가 음성 샘플을 분석하여 모델을 생성하고 있습니다.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-onair-mint/20 rounded-full flex items-center justify-center mx-auto">
                  <Wand2 className="w-8 h-8 text-onair-mint animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-onair-text">"{modelName}" 모델 생성 중...</h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-onair-text-sub">진행률</span>
                  <span className="text-onair-mint">{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="h-2" />
              </div>

              <div className="bg-onair-bg/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-onair-text">처리 단계</h4>
                <div className="space-y-1 text-sm text-onair-text-sub">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>음성 샘플 전처리 완료</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>음성 특성 분석 완료</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {processingProgress > 50 ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-onair-mint border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>AI 모델 훈련 중...</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {processingProgress > 80 ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <div className="w-4 h-4 border border-onair-text-sub/20 rounded-full" />
                    )}
                    <span>모델 최적화 및 검증</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-onair-text-sub">
                예상 소요 시간: 3-5분 (음성 품질에 따라 달라질 수 있습니다)
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card className="bg-onair-bg-sub border-onair-text-sub/20">
            <CardHeader>
              <CardTitle className="text-onair-text flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                모델 생성 완료!
              </CardTitle>
              <p className="text-onair-text-sub">"{modelName}" AI 모델이 성공적으로 생성되었습니다.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-onair-mint/10 to-onair-blue/10 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-onair-text mb-2">축하합니다! 🎉</h3>
                <p className="text-onair-text-sub">
                  새로운 AI 음성 모델이 준비되었습니다. 이제 훈련에서 사용할 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-onair-bg rounded-lg p-4 text-center">
                  <h4 className="font-medium text-onair-text mb-1">모델 품질</h4>
                  <p className="text-2xl font-bold text-onair-mint">92%</p>
                  <p className="text-xs text-onair-text-sub">매우 우수</p>
                </div>
                <div className="bg-onair-bg rounded-lg p-4 text-center">
                  <h4 className="font-medium text-onair-text mb-1">유사도</h4>
                  <p className="text-2xl font-bold text-onair-orange">89%</p>
                  <p className="text-xs text-onair-text-sub">원본과 매우 유사</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setStep(1)
                    setRecordedSamples([])
                    setModelName("")
                    setModelDescription("")
                    setProcessingProgress(0)
                  }}
                  variant="outline"
                  className="flex-1 border-onair-text-sub/20"
                >
                  새 모델 만들기
                </Button>
                <Button className="flex-1 bg-onair-mint hover:bg-onair-mint/90 text-onair-bg">모델 테스트하기</Button>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 진행 단계 표시 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber ? "bg-onair-mint text-onair-bg" : "bg-onair-text-sub/20 text-onair-text-sub"
                }`}
              >
                {step > stepNumber ? <CheckCircle className="w-4 h-4" /> : stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`w-16 h-0.5 ${step > stepNumber ? "bg-onair-mint" : "bg-onair-text-sub/20"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-onair-text-sub">
          <span>음성 수집</span>
          <span>정보 설정</span>
          <span>모델 생성</span>
          <span>완료</span>
        </div>
      </div>

      {renderStep()}
    </div>
  )
}
