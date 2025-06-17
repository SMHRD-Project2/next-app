"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Play, Pause, Star, Volume2 } from "lucide-react"
import { Trash2 } from "lucide-react"

// localStorage에서 기본 모델 ID를 가져오는 함수
const getDefaultModelId = (): number | null => {
  if (typeof window !== 'undefined') {
    const savedDefaultId = localStorage.getItem('defaultModelId');
    return savedDefaultId ? parseInt(savedDefaultId) : null;
  }
  return null;
}

// 초기 aiModels 설정 시 localStorage의 기본 모델 ID를 반영
export const aiModels = [
  {
    id: 1,
    name: "김주하 아나운서",
    type: "뉴스 앵커",
    quality: "프리미엄",
    description: "정확하고 신뢰감 있는 뉴스 전달 스타일",
    avatar: "/placeholder.svg?height=40&width=40",
    isDefault: getDefaultModelId() === 1,
    createdAt: "2024-01-01",
    usageCount: 156,
    url: "/audio/SPK005.wav"
  },
  {
    id: 2,
    name: "이동욱 아나운서",
    type: "스포츠 캐스터",
    quality: "프리미엄",
    description: "역동적이고 열정적인 스포츠 중계 스타일",
    avatar: "/placeholder.svg?height=40&width=40",
    isDefault: getDefaultModelId() === 2,
    createdAt: "2024-01-01",
    usageCount: 89,
  },
  {
    id: 3,
    name: "박소현 아나운서",
    type: "교양 프로그램",
    quality: "프리미엄",
    description: "부드럽고 친근한 교양 프로그램 진행 스타일",
    avatar: "/placeholder.svg?height=40&width=40",
    isDefault: getDefaultModelId() === 3,
    createdAt: "2024-01-01",
    usageCount: 134,
  }
]

// Add event emitter for model changes
const modelChangeEvent = new Event('aiModelChange')

export const addNewModel = (newModel: {
  id: number;
  name: string;
  type: string;
  quality: string;
  description: string;
  avatar: string;
  isDefault: boolean;
  createdAt: string;
  usageCount: number;
}) => {
  aiModels.push(newModel);
  window.dispatchEvent(modelChangeEvent);
  return newModel;
}

export function AIModelManager() {
  const [playingModel, setPlayingModel] = useState<number | null>(null)
  const [models, setModels] = useState(aiModels)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlay = (modelId: number) => {
    if (playingModel === modelId) {
      // 같은 모델이 클릭된 경우, 재생 중지
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setPlayingModel(null)
    } else {
      // 다른 모델이 클릭된 경우, 현재 재생 중지하고 새로운 재생 시작
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      
      // 새로운 오디오 요소 생성
      const audio = new Audio('/audio/female.wav')
      audioRef.current = audio
      
      audio.play()
      setPlayingModel(modelId)
      
      // 오디오가 끝나면 상태 초기화
      audio.onended = () => {
        setPlayingModel(null)
        audioRef.current = null
      }
    }
  }

  const handleSetDefault = (modelId: number) => {
    // Update local state
    setModels(currentModels =>
      currentModels.map(model => ({
        ...model,
        isDefault: model.id === modelId,
      }))
    )
    
    // Update global aiModels array
    aiModels.forEach(model => {
      model.isDefault = model.id === modelId;
    });
    
    // Save to localStorage
    localStorage.setItem('defaultModelId', modelId.toString());
    
    // Dispatch event to notify other components
    window.dispatchEvent(modelChangeEvent);
    
    console.log("기본 모델로 설정 (API 호출 필요):", modelId);
  }

  const handleDelete = (modelId: number) => {
    if (window.confirm("이 모델을 정말 삭제하시겠습니까?")) {
      setModels(currentModels => currentModels.filter(model => model.id !== modelId));
      console.log("모델 삭제 (API 호출 필요):", modelId);
      /* 모델 삭제  */
      alert("모델이 삭제되었습니다.");
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "프리미엄":
        return "bg-onair-mint/10 text-onair-mint border-onair-mint/20"
      case "사용자 생성":
        return "bg-onair-orange/10 text-onair-orange border-onair-orange/20"
      case "교육용":
        return "border-onair-blue text-onair-blue hover:bg-onair-blue hover:text-onair-bg"
      case "교육용":
        return "border-onair-blue text-onair-blue hover:bg-onair-blue hover:text-onair-bg"
      default:
        return "bg-onair-text-sub/10 text-onair-text-sub border-onair-text-sub/20"
    }
  }

  // 재생 버튼의 클래스를 모델 타입에 따라 반환하는 헬퍼 함수
  const getPlayButtonClasses = (type: string) => {
    switch (type) {
      case "뉴스 앵커":
      case "스포츠 캐스터":
      case "교양 프로그램":
        return "border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg"
      case "개인 맞춤":
        return "border-onair-orange text-onair-orange hover:bg-onair-orange hover:text-onair-bg"
      case "교육용":
        return "border-onair-orange text-onair-orange hover:bg-onair-orange hover:text-onair-bg"
      default:
        return "border-onair-text-sub/20 text-onair-text-sub hover:bg-onair-text-sub hover:text-onair-bg"
    }
  }

  // 음성 파형 막대 색상을 모델 타입에 따라 반환하는 헬퍼 함수
  const getWaveformBarColor = (type: string) => {
    switch (type) {
      case "개인 맞춤":
        return "bg-onair-orange/60" // 개인 맞춤 모델은 주황색 계열
      case "교육용":
        return "bg-onair-orange/60" // 교육용 모델은 주황색 계열로 변경
      default:
        return "bg-onair-mint/60" // 기본값은 민트색 계열 (프리미엄 모델 등)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-onair-text">내 AI 모델</h2>
          <p className="text-onair-text-sub">총 {models.length}개의 AI 음성 모델</p>
        </div>
      </div>

      <div className="grid gap-4">
        {models.map((model) => ( // aiModels 대신 models 상태 변수를 사용
          <Card key={model.id} className="bg-onair-bg-sub border-onair-text-sub/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={model.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-onair-bg text-onair-mint">{model.name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-onair-text">{model.name}</h3>
                      {/* 모델이 기본 모델일 경우 별 아이콘 표시 */}
                      {model.isDefault && <Star className="w-4 h-4 text-onair-orange fill-current" />}
                      <Badge className={getQualityColor(model.quality)}>{model.quality}</Badge>
                    </div>

                    <p className="text-sm text-onair-text-sub">{model.description}</p>

                    <div className="flex items-center space-x-4 text-xs text-onair-text-sub">
                      <span>유형: {model.type}</span>
                      <span>사용 횟수: {model.usageCount}회</span>
                      <span>생성일: {model.createdAt}</span>
                    </div>

                    {/* 음성 파형 시각화 */}
                    <div className="flex items-center space-x-1 h-6 bg-onair-bg rounded p-1">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className={`${getWaveformBarColor(model.type)} rounded-full ${playingModel === model.id ? "animate-wave" : ""}`}
                          style={{
                            width: "2px",
                            height: `${Math.random() * 16 + 4}px`,
                            animationDelay: playingModel === model.id ? `${i * 0.05}s` : "0s",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {model.quality === "사용자 생성" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(model.id)}
                      className="border-onair-red text-onair-red hover:bg-onair-red/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlay(model.id)}
                    className={getPlayButtonClasses(model.type)}
                  >
                    {playingModel === model.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* 기본 모델 설정 버튼 항상 표시, isDefault 값에 따라 스타일 변경 */}
              <div className="mt-4 pt-4 border-t border-onair-text-sub/10">
                <Button
                  size="sm"
                  onClick={() => handleSetDefault(model.id)}
                  // isDefault 값에 따라 클래스 변경
                  className={`${
                    model.isDefault
                      ? "bg-onair-orange text-onair-bg hover:bg-onair-orange-dark" // 선택되었을 때 진한 오렌지
                      : "border border-onair-orange text-onair-orange bg-transparent hover:bg-onair-orange/10" // 선택되지 않았을 때 기존 스타일
                  }`}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {model.isDefault ? "현재 선택된 모델" : "기본 모델로 설정"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
