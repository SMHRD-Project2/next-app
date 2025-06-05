"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Play, Pause, Settings, Trash2, Star } from "lucide-react"

const aiModels = [
  {
    id: 1,
    name: "김주하 아나운서",
    type: "뉴스 앵커",
    quality: "프리미엄",
    description: "정확하고 신뢰감 있는 뉴스 전달 스타일",
    avatar: "/placeholder.svg?height=40&width=40",
    isDefault: true,
    createdAt: "2024-01-01",
    usageCount: 156,
  },
  {
    id: 2,
    name: "이동욱 아나운서",
    type: "스포츠 캐스터",
    quality: "프리미엄",
    description: "역동적이고 열정적인 스포츠 중계 스타일",
    avatar: "/placeholder.svg?height=40&width=40",
    isDefault: true,
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
    isDefault: true,
    createdAt: "2024-01-01",
    usageCount: 134,
  },
  {
    id: 4,
    name: "내 목소리 모델",
    type: "개인 맞춤",
    quality: "사용자 생성",
    description: "내 목소리를 기반으로 생성된 AI 모델",
    avatar: "/placeholder.svg?height=40&width=40",
    isDefault: false,
    createdAt: "2024-01-05",
    usageCount: 23,
  },
  {
    id: 5,
    name: "친구 목소리",
    type: "개인 맞춤",
    quality: "사용자 생성",
    description: "친구의 목소리를 클로닝한 AI 모델",
    avatar: "/placeholder.svg?height=40&width=40",
    isDefault: false,
    createdAt: "2024-01-10",
    usageCount: 8,
  },
  {
    id: 6,
    name: "선생님 목소리",
    type: "교육용",
    quality: "사용자 생성",
    description: "발음 선생님의 목소리를 클로닝한 모델",
    avatar: "/placeholder.svg?height=40&width=40",
    isDefault: false,
    createdAt: "2024-01-12",
    usageCount: 45,
  },
]

export function AIModelManager() {
  const [playingModel, setPlayingModel] = useState<number | null>(null)
  const [selectedModel, setSelectedModel] = useState<number | null>(null)

  const handlePlay = (modelId: number) => {
    setPlayingModel(playingModel === modelId ? null : modelId)
  }

  const handleSetDefault = (modelId: number) => {
    setSelectedModel(modelId)
    // 실제로는 기본 모델 설정 API 호출
  }

  const handleDelete = (modelId: number) => {
    // 실제로는 모델 삭제 API 호출
    console.log("모델 삭제:", modelId)
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "프리미엄":
        return "bg-onair-mint/10 text-onair-mint border-onair-mint/20"
      case "사용자 생성":
        return "bg-onair-orange/10 text-onair-orange border-onair-orange/20"
      default:
        return "bg-onair-text-sub/10 text-onair-text-sub border-onair-text-sub/20"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-onair-text">내 AI 모델</h2>
          <p className="text-onair-text-sub">총 {aiModels.length}개의 AI 음성 모델</p>
        </div>
        <Button className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg">새 모델 추가</Button>
      </div>

      <div className="grid gap-4">
        {aiModels.map((model) => (
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
                          className={`bg-onair-mint/60 rounded-full ${playingModel === model.id ? "animate-wave" : ""}`}
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlay(model.id)}
                    className="border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg"
                  >
                    {playingModel === model.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-onair-text-sub/20 text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  {!model.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(model.id)}
                      className="border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {!model.isDefault && (
                <div className="mt-4 pt-4 border-t border-onair-text-sub/10">
                  <Button
                    size="sm"
                    onClick={() => handleSetDefault(model.id)}
                    className="bg-onair-orange hover:bg-onair-orange/90 text-onair-bg"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    기본 모델로 설정
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
