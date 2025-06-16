"use client"

import type React from "react"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Upload, Mic, Play, Square, CheckCircle, Wand2, RefreshCw, Volume2, Speech, ChevronDown, MessageSquare, Star, Circle, PlayCircle, Pause } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { aiModels, addNewModel } from "@/components/ai-model-manager"

interface VoiceCloningStudioProps {
  onSaveSuccess: () => void
}

export function VoiceCloningStudio({ onSaveSuccess }: VoiceCloningStudioProps) {
  const [step, setStep] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedSamples, setRecordedSamples] = useState<Blob[]>([])
  const [recordedUrls, setRecordedUrls] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [modelName, setModelName] = useState("")
  const [modelDescription, setModelDescription] = useState("")
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(-1)

  // MediaRecorder 관련 상태
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const allSampleTexts = [
    "안녕하세요, 저는 AI 음성 모델 생성을 위한 샘플 음성을 녹음하고 있습니다. 오늘은 제 목소리로 여러분과 함께하게 되어 기쁩니다. 앞으로 다양한 콘텐츠를 제작하는데 도움이 되었으면 좋겠습니다.",
    
    "오늘은 날씨가 정말 좋네요. 맑은 하늘과 따뜻한 햇살이 기분을 좋게 만듭니다. 이런 날씨에는 산책을 하거나 카페에서 책을 읽는 것도 좋을 것 같습니다. 여러분은 오늘 어떤 계획을 가지고 계신가요?",
    
    "뉴스를 전해드리겠습니다. 오늘 주요 경제 지표가 발표되었습니다. 실업률이 전년 대비 0.5% 감소했으며, 소비자 물가지수는 안정세를 보이고 있습니다. 전문가들은 내년 상반기까지 이러한 추세가 이어질 것으로 전망하고 있습니다.",
    
    "교육은 미래를 만드는 가장 중요한 투자입니다. 꾸준한 학습이 성공의 열쇠입니다. 특히 요즘은 평생학습의 시대라고 합니다. 새로운 기술과 지식을 배우는 것은 우리의 삶을 더욱 풍요롭게 만들어줄 것입니다.",
    
    "기술의 발전은 우리 삶을 더욱 편리하게 만들어주고 있습니다. 인공지능과 빅데이터는 이제 우리 일상의 일부가 되었습니다. 이러한 기술들이 앞으로 어떤 변화를 가져올지 기대가 됩니다.",
    
    "음악은 마음의 언어입니다. 감정을 표현하는 가장 아름다운 방법이죠. 좋은 음악은 우리의 마음을 치유하고 위로해줍니다. 여러분은 어떤 음악을 좋아하시나요?",
    
    "여행은 새로운 경험과 추억을 만드는 특별한 시간입니다. 낯선 곳에서 만나는 사람들과의 만남, 새로운 문화를 경험하는 것은 우리의 시야를 넓혀줍니다. 다음 여행지는 어디로 가고 싶으신가요?",
    
    "건강한 식습관은 행복한 삶의 기본입니다. 신선한 채소와 과일을 충분히 섭취하고, 규칙적인 식사를 하는 것이 중요합니다. 또한 충분한 수분 섭취도 잊지 마세요.",
    
    "독서는 마음의 양식입니다. 책을 통해 새로운 세계를 만나보세요. 좋은 책 한 권은 우리의 인생을 바꿀 수도 있습니다. 오늘은 어떤 책을 읽어보시겠어요?",
    
    "운동은 건강한 삶을 위한 필수 요소입니다. 규칙적인 운동은 우리의 신체적, 정신적 건강을 모두 향상시켜줍니다. 하루 30분만이라도 운동하는 습관을 들여보세요."
  ]

  const [sampleTexts, setSampleTexts] = useState<string[]>([])

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 랜덤 샘플 텍스트 생성 함수
  const generateRandomSample = () => {
    const randomIndex = Math.floor(Math.random() * allSampleTexts.length)
    const selectedText = allSampleTexts[randomIndex]
    setSampleTexts([selectedText])
    
    // 콘솔에 선택된 텍스트 출력
    console.log('🎯 랜덤으로 선택된 텍스트:', selectedText)
    console.log('📝 텍스트 인덱스:', randomIndex)
    
    // 녹음된 샘플이 있다면 초기화
    setRecordedSamples([])
    setRecordedUrls([])
  }

  // TTS 예시 듣기
  const handlePlaySampleTTS = () => {
    if (!sampleTexts[0]) return
    const utter = new window.SpeechSynthesisUtterance(sampleTexts[0])
    utter.lang = "ko-KR"
    window.speechSynthesis.speak(utter)
  }

  // 컴포넌트가 마운트될 때 랜덤 샘플 텍스트 선택
  useEffect(() => {
    generateRandomSample()
  }, [])

  // WAV 파일로 변환하는 함수
  const convertToWav = (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        // 간단한 WAV 헤더 생성 (실제로는 WebCodecs API나 외부 라이브러리 사용 권장)
        resolve(new Blob([audioBlob], { type: 'audio/wav' }))
      }
      reader.readAsArrayBuffer(audioBlob)
    })
  }

  // 녹음 시작/중지 처리
  const handleRecord = async (index: number) => {
    if (isRecording && currentRecordingIndex === index) {
      // 녹음 중지
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      setCurrentRecordingIndex(-1)
    } else {
      // 녹음 시작
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            sampleSize: 16
          } 
        })
        
        // WAV 형식으로 설정
        const options = { mimeType: 'audio/webm;codecs=opus' }
        const mediaRecorder = new MediaRecorder(stream, options)
        
        audioChunksRef.current = []
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          const wavBlob = await convertToWav(audioBlob)
          
          // 새로운 배열 생성
          const newSamples = [...recordedSamples]
          const newUrls = [...recordedUrls]
          
          newSamples[index] = wavBlob
          newUrls[index] = URL.createObjectURL(wavBlob)
          
          setRecordedSamples(newSamples)
          setRecordedUrls(newUrls)
          
          // 콘솔에 녹음 정보 출력
          console.log(`🎙️ 샘플 ${index + 1} 녹음 완료:`)
          console.log('📄 녹음된 텍스트:', sampleTexts[index])
          console.log('🎵 오디오 파일 정보:', {
            size: `${(wavBlob.size / 1024).toFixed(2)} KB`,
            type: wavBlob.type,
            url: newUrls[index]
          })
          console.log('💾 WAV Blob 객체:', wavBlob)
          
          // 스트림 정리
          stream.getTracks().forEach(track => track.stop())
        }
        
        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setIsRecording(true)
        setCurrentRecordingIndex(index)
        
        console.log(`🔴 샘플 ${index + 1} 녹음 시작`)
        console.log('📝 녹음할 텍스트:', sampleTexts[index])
        
      } catch (error) {
        console.error('마이크 접근 오류:', error)
        alert('마이크에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.')
      }
    }
  }

  // 녹음된 오디오 재생
  const handlePlayRecording = (index: number) => {
    if (recordedUrls[index]) {
      const audio = new Audio(recordedUrls[index])
      audio.play()
      
      console.log(`▶️ 샘플 ${index + 1} 재생`)
      console.log('📄 재생 중인 텍스트:', sampleTexts[index])
      console.log('🎵 오디오 URL:', recordedUrls[index])
    }
  }

  // 녹음 파일 다운로드
  const handleDownloadRecording = (index: number) => {
    if (recordedSamples[index]) {
      const url = URL.createObjectURL(recordedSamples[index])
      const a = document.createElement('a')
      a.href = url
      a.download = `voice_sample_${index + 1}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log(`💾 샘플 ${index + 1} 다운로드`)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      const newSamples = [...recordedSamples]
      const newUrls = [...recordedUrls]
      
      newSamples[0] = file
      newUrls[0] = URL.createObjectURL(file)
      
      setRecordedSamples(newSamples)
      setRecordedUrls(newUrls)
      
      console.log('📁 파일 업로드됨:', {
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const newSamples = [...recordedSamples]
      const newUrls = [...recordedUrls]
      
      newSamples[0] = file
      newUrls[0] = URL.createObjectURL(file)
      
      setRecordedSamples(newSamples)
      setRecordedUrls(newUrls)
      
      console.log('📁 파일 선택됨:', {
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type
      })
    }
  }

  // Fast API로 데이터 전송하고 실시간 진행률 수신하는 함수
  const sendToFastAPI = async () => {
    if (!recordedSamples[0] || !sampleTexts[0]) {
      alert("음성 샘플과 텍스트가 필요합니다.")
      return
    }

    try {
      console.log('🚀 Fast API로 데이터 전송 시작...')
      
      // FormData 생성
      const formData = new FormData()
      formData.append('text', sampleTexts[0])
      formData.append('audio', recordedSamples[0], 'voice_sample.wav')
      
      console.log('📤 전송할 데이터:')
      console.log('📝 텍스트:', sampleTexts[0])
      console.log('🎵 오디오 파일:', {
        size: `${(recordedSamples[0].size / 1024).toFixed(2)} KB`,
        type: recordedSamples[0].type
      })

      const response = await fetch('http://localhost:8000/process-voice', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      console.log('✅ Fast API 응답 성공!')
      console.log('📥 받은 데이터:', result)
      
      return result

    } catch (error) {
      console.error('❌ Fast API 통신 오류:', error)
      alert('서버 통신 중 오류가 발생했습니다. 서버가 실행되고 있는지 확인해주세요.')
      throw error
    }
  }

  // 실시간 진행률 스트림 연결 함수
  const connectProgressStream = (taskId: string) => {
    console.log(`📡 SSE 연결 시도: http://localhost:8000/process-voice-stream/${taskId}`)
    
    const eventSource = new EventSource(`http://localhost:8000/process-voice-stream/${taskId}`)
    
    eventSource.onopen = () => {
      console.log('✅ SSE 연결 성공')
    }
    
    eventSource.onmessage = (event) => {
      try {
        console.log('📨 SSE 메시지 수신:', event.data)
        const data = JSON.parse(event.data)
        console.log('📊 실시간 진행률:', data)
        
        setProcessingProgress(data.progress)
        
        if (data.completed || data.progress >= 100) {
          console.log('🏁 진행률 완료, SSE 연결 종료')
          eventSource.close()
          setIsProcessing(false)
          setStep(4) // 완료 단계로 이동
          
          console.log('✅ AI 모델 생성 완료:', {
            taskId: data.task_id,
            finalProgress: data.progress
          })
        }
        
      } catch (error) {
        console.error('❌ 진행률 데이터 파싱 오류:', error)
        console.log('원본 데이터:', event.data)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('❌ SSE 연결 오류:', error)
      console.log('SSE 상태:', eventSource.readyState)
      console.log('0: CONNECTING, 1: OPEN, 2: CLOSED')
      
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('SSE 연결이 서버에 의해 닫혔습니다.')
      }
      
      eventSource.close()
      setIsProcessing(false)
      
      // 폴백: 기존 방식으로 진행률 시뮬레이션
      console.log('🔄 폴백: 로컬 진행률 시뮬레이션 시작')
      simulateLocalProgress()
    }
    
    // 연결 타임아웃 설정
    setTimeout(() => {
      if (eventSource.readyState === EventSource.CONNECTING) {
        console.log('⏰ SSE 연결 타임아웃, 폴백 실행')
        eventSource.close()
        simulateLocalProgress()
      }
    }, 5000) // 5초 타임아웃
    
    return eventSource
  }

  // 폴백용 로컬 진행률 시뮬레이션
  const simulateLocalProgress = () => {
    console.log('🔄 로컬 진행률 시뮬레이션 시작')
    
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          setStep(4)
          console.log('✅ 로컬 시뮬레이션 완료')
          return 100
        }
        const newProgress = prev + Math.random() * 10
        console.log(`📊 로컬 진행률: ${Math.round(newProgress)}%`)
        return Math.min(newProgress, 100)
      })
    }, 800)
  }

  // SSE 연결 테스트 함수 (디버깅용)
  // const testSSEConnection = () => {
  //   console.log('🧪 SSE 연결 테스트 시작')
  //   const testEventSource = new EventSource('http://localhost:8000/test-sse')
    
  //   testEventSource.onopen = () => {
  //     console.log('✅ 테스트 SSE 연결 성공')
  //   }
    
  //   testEventSource.onmessage = (event) => {
  //     console.log('📨 테스트 메시지:', event.data)
  //     const data = JSON.parse(event.data)
  //     if (data.completed) {
  //       testEventSource.close()
  //       console.log('🏁 테스트 완료')
  //     }
  //   }
    
  //   testEventSource.onerror = (error) => {
  //     console.error('❌ 테스트 SSE 오류:', error)
  //     testEventSource.close()
  //   }
  // }

  const handleCreateModel = async () => {
    if (!modelName.trim()) {
      alert("모델 이름을 입력해주세요.")
      return
    }

    console.log('🚀 AI 모델 생성 시작:', {
      modelName,
      modelDescription,
      samplesCount: recordedSamples.length,
      sampleTexts: sampleTexts,
      audioFiles: recordedSamples.map((sample, index) => ({
        index: index + 1,
        size: `${(sample.size / 1024).toFixed(2)} KB`,
        type: sample.type
      }))
    })

    setIsProcessing(true)
    setProcessingProgress(0)
    setStep(3) // 처리 단계로 이동

    // SSE 연결 테스트 (옵션)
    // testSSEConnection()

    try {
      // Fast API로 데이터 전송
      const apiResult = await sendToFastAPI()
      
      if (apiResult.status === 'success' && apiResult.task_id) {
        console.log('📡 실시간 진행률 스트림 연결 중...')
        console.log('Task ID:', apiResult.task_id)
        
        // 실시간 진행률 스트림 연결
        connectProgressStream(apiResult.task_id)
        
      } else {
        throw new Error('작업 ID를 받지 못했습니다.')
      }

    } catch (error) {
      setIsProcessing(false)
      setProcessingProgress(0)
      console.error('모델 생성 실패:', error)
      // 오류 시에도 폴백 실행
      simulateLocalProgress()
    }
  }

  const handleSaveModel = () => {
    // Create a new model object
    const newModel = {
      id: aiModels.length + 1,
      name: modelName,
      type: "개인 맞춤",
      quality: "사용자 생성",
      description: modelDescription || "내 목소리를 기반으로 생성된 AI 모델",
      avatar: "/placeholder.svg?height=40&width=40",
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0],
      usageCount: 0
    };

    // Add the new model to the list
    addNewModel(newModel);

    // Show success message
    alert("AI 모델이 성공적으로 저장되었습니다!");

    // Show navigation confirmation
    if (window.confirm("내 AI 모델로 이동하시겠습니까?")) {
      // Reset the form
      setStep(1);
      setRecordedSamples([]);
      setModelName("");
      setModelDescription("");
      setProcessingProgress(0);
      
      // Call the onSaveSuccess callback to switch tabs
      onSaveSuccess();
    }
    // 취소 버튼을 눌렀을 때는 아무 동작도 하지 않음
  };

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
              <p className="text-onair-text-sub">고품질 AI 모델 생성을 위해 음성 샘플이 필요합니다.</p>
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
                  <div className="flex gap-2 justify-end mb-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-onair-mint text-onair-mint"
                      onClick={generateRandomSample}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      className="border-onair-mint text-onair-mint flex items-center gap-2"
                      onClick={handlePlaySampleTTS}
                    >
                      <Volume2 className="w-5 h-5" />
                      <span>AI 예시 듣기</span>
                    </Button>
                  </div>

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
                            (isRecording && currentRecordingIndex === index)
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
                          }
                        >
                          {(isRecording && currentRecordingIndex === index) ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          {(isRecording && currentRecordingIndex === index) ? "중지" : "녹음"}
                        </Button>
                        {recordedSamples[index] && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-onair-blue text-onair-blue"
                              onClick={() => handlePlayRecording(index)}
                            >
                              <Play className="w-4 h-4" />
                              재생
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-onair-orange text-onair-orange"
                              onClick={() => handleDownloadRecording(index)}
                            >
                              💾 WAV
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      isDragging ? "border-onair-mint bg-onair-mint/10" : "border-onair-text-sub/20"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-onair-text-sub mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-onair-text mb-2">음성 파일 업로드</h3>
                    <p className="text-onair-text-sub mb-4">WAV, MP3, M4A 파일을 드래그하거나 클릭하여 업로드하세요</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".wav,.mp3,.m4a"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="voice-upload"
                    />
                  </div>

                  {recordedSamples.length > 0 && recordedSamples[0] && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-onair-text">업로드된 파일</h4>
                      <div className="flex items-center justify-between p-2 bg-onair-bg rounded">
                        <span className="text-onair-text-sub">voice_sample_1.wav</span>
                        <div className="flex gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-onair-blue text-onair-blue h-6 px-2"
                            onClick={() => handlePlayRecording(0)}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-between items-center pt-4 border-t border-onair-text-sub/10">
                <div className="text-sm text-onair-text-sub">진행률: {recordedSamples.filter(sample => sample).length}/1 샘플 완료</div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={recordedSamples.filter(sample => sample).length < 1}
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
                    sample && (
                      <div key={index} className="flex items-center space-x-2 text-sm text-onair-text-sub">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>샘플 {index + 1}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-onair-text-sub/10">
                <Button variant="outline" onClick={() => setStep(1)} className="border-onair-text-sub/20">
                  이전 단계
                </Button>
                <Button
                  onClick={handleCreateModel}
                  disabled={!modelName.trim() || isProcessing}
                  className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
                >
                  {isProcessing ? "처리 중..." : "모델 생성 시작"}
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

              <div className="flex gap-4 mt-6">
                <Button
                  onClick={() => {
                    setStep(1)
                    setRecordedSamples([])
                    setRecordedUrls([])
                    setModelName("")
                    setModelDescription("")
                    setProcessingProgress(0)
                    generateRandomSample()
                  }}
                  variant="outline"
                  className="flex-1 border-onair-text-sub/20"
                >
                  새 모델 만들기
                </Button>
                <Button 
                  onClick={handleSaveModel}
                  className="flex-1 bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
                >
                  내 AI 모델에 저장하기
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  // 컴포넌트 언마운트 시 URL 정리
  useEffect(() => {
    return () => {
      recordedUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

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
