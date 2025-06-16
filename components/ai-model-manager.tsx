"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Play, Pause, Star, Volume2 } from "lucide-react"
import { Trash2 } from "lucide-react"
import { getAuthStatus } from "@/lib/auth-utils"
import { useAIModels } from "@/lib/ai-model-context"

interface AIModel {
  id: number;
  _id?: string;
  name: string;
  type: string;
  quality: string;
  description: string;
  avatar: string;
  isDefault: boolean;
  createdAt: string;
  usageCount: number;
  url: string;
}

export function AIModelManager() {
  const [playingModel, setPlayingModel] = useState<number | null>(null)
  const { models, isLoading, error, refreshModels } = useAIModels()

  const handlePlay = (modelId: number) => {
    setPlayingModel(playingModel === modelId ? null : modelId)
  }

  const handleSetDefault = async (modelId: number) => {
    try {
      const { userProfile } = getAuthStatus();
      if (!userProfile?.email) {
        console.error("사용자 이메일을 찾을 수 없습니다.");
        return;
      }

      const selectedModel = models.find(model => model.id === modelId);
      if (!selectedModel) {
        console.error("선택한 모델을 찾을 수 없습니다.");
        return;
      }

      const response = await fetch("/api/models", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: userProfile.email,
          modelId: selectedModel._id
        }),
      });

      if (!response.ok) {
        throw new Error("기본 모델 설정에 실패했습니다.");
      }

      await refreshModels();
    } catch (error) {
      console.error("기본 모델 설정 중 오류 발생:", error);
    }
  };

  const handleDelete = async (modelId: number) => {
    if (window.confirm("이 모델을 정말 삭제하시겠습니까?")) {
      try {
        const { userProfile } = getAuthStatus();
        if (!userProfile?.email) {
          console.error("사용자 이메일을 찾을 수 없습니다.");
          return;
        }

        const selectedModel = models.find(model => model.id === modelId);
        if (!selectedModel) {
          console.error("선택한 모델을 찾을 수 없습니다.");
          return;
        }

        const response = await fetch(`/api/models/${selectedModel._id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userEmail: userProfile.email,
          }),
        });

        if (!response.ok) {
          throw new Error("모델 삭제에 실패했습니다.");
        }

        await refreshModels();
        alert("모델이 삭제되었습니다.");
      } catch (error) {
        console.error("모델 삭제 중 오류 발생:", error);
        alert("모델 삭제에 실패했습니다.");
      }
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
      default:
        return "bg-onair-text-sub/10 text-onair-text-sub border-onair-text-sub/20"
    }
  }

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

  const getWaveformBarColor = (type: string) => {
    switch (type) {
      case "개인 맞춤":
        return "bg-onair-orange/60"
      case "교육용":
        return "bg-onair-orange/60"
      default:
        return "bg-onair-mint/60"
    }
  }

  if (isLoading) {
    return <div>로딩 중...</div>
  }

  if (error) {
    return <div>에러: {error}</div>
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
        {models.map((model) => (
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
                  <Button
                    variant="outline"
                    size="sm"
                    className={getPlayButtonClasses(model.type)}
                    onClick={() => handlePlay(model.id)}
                  >
                    {playingModel === model.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-onair-text-sub/20 text-onair-text-sub hover:bg-onair-text-sub hover:text-onair-bg"
                    onClick={() => handleSetDefault(model.id)}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                  {model.quality !== "프리미엄" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDelete(model.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
