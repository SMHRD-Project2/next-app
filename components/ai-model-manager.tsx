"use client"

import { useState, useRef } from "react"
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
  createdAt: string;
  usageCount: number;
  url: string;
}

export function AIModelManager() {
  const [playingModel, setPlayingModel] = useState<number | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const { models, isLoading, error, refreshModels, defaultModelId } = useAIModels()
  const [modelType, setModelType] = useState<"전체" | "프리미엄" | "사용자 생성">("전체")

  const handlePlay = async (modelId: number) => {
    try {
      const selectedModel = models.find(model => model.id === modelId);
      if (!selectedModel) {
        console.error("선택한 모델을 찾을 수 없습니다.");
        return;
      }

      // 이미 재생 중인 모델을 다시 클릭한 경우
      if (playingModel === modelId) {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          URL.revokeObjectURL(currentAudio.src);
        }
        setPlayingModel(null);
        setCurrentAudio(null);
        return;
      }

      // 이전에 재생 중이던 모델이 있다면 중지
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        URL.revokeObjectURL(currentAudio.src);
      }

      console.log("=== 음성 재생 정보 ===");
      console.log("원본 URL:", selectedModel.url);
      console.log("모델명:", selectedModel.name);
      console.log("===================");

      // 음성 파일 가져오기
      const response = await fetch(selectedModel.url);
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setPlayingModel(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.error("오디오 재생 중 오류 발생");
        setPlayingModel(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setPlayingModel(modelId);
      setCurrentAudio(audio);
    } catch (error) {
      console.error("음성 재생 중 오류 발생:", error);
      setPlayingModel(null);
      setCurrentAudio(null);
    }
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

      const response = await fetch("/api/users/default-model", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userProfile.email,
          modelId: selectedModel._id
        }),
      });

      if (!response.ok) {
        throw new Error("기본 모델 설정에 실패했습니다.");
      }

      const result = await response.json();
      console.log("기본 모델 설정 결과:", result);
      
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

        console.log("삭제할 모델 정보:", {
          id: selectedModel._id,
          name: selectedModel.name
        });

        const response = await fetch(`/api/models?id=${selectedModel._id}`, {
          method: "DELETE",
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
    return (
      <div className="flex justify-center items-center h-40">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-onair-mint rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-3 h-3 bg-onair-mint rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-3 h-3 bg-onair-mint rounded-full animate-bounce" />
        </div>
      </div>
    )
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

      <div className="flex flex-wrap gap-2.5 mb-2">
        {["전체", "프리미엄", "사용자 생성"].map((type) => (
          <label
            key={type}
            className={`
              flex items-center gap-1 cursor-pointer px-3 py-1 rounded-full border
              transition whitespace-nowrap
              ${modelType === type
                ? "bg-onair-mint text-white border-onair-mint font-semibold"
                : "bg-onair-bg-sub text-onair-text-sub border-onair-text-sub/20"}
            `}
          >
            <input
              type="radio"
              name="modelType"
              value={type}
              checked={modelType === type}
              onChange={() => setModelType(type as typeof modelType)}
              className="hidden"
            />
            <span className="text-sm">{type === "전체" ? "전체 보기" : type}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-4">
        {models
          .filter((model) => modelType === "전체" || model.quality === modelType)
          .map((model) => (
            <Card key={model.id} className="bg-onair-bg-sub border-onair-text-sub/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={model.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gray-500 text-white font-semibold text-lg">
                        {model.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-onair-text truncate">{model.name}</h3>
                        {defaultModelId === model._id && <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />}
                        <Badge className={getQualityColor(model.quality)}>{model.quality}</Badge>
                      </div>

                      <p className="text-sm text-onair-text-sub line-clamp-2">{model.description}</p>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-onair-text-sub">
                        <span className="truncate">유형: {model.type}</span>
                        <span className="truncate">생성일: {model.createdAt}</span>
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

                  <div className="flex items-center justify-end gap-2 flex-shrink-0">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className={`${defaultModelId === model._id ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-white' : 'border-onair-text-sub/20 text-onair-text-sub hover:bg-onair-text-sub hover:text-onair-bg'}`}
                      onClick={() => handleSetDefault(model.id)}
                    >
                      <Star className={`w-4 h-4 ${defaultModelId === model._id ? 'fill-current' : ''}`} />
                    </Button>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
