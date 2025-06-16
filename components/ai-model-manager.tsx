"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Play, Pause, Star, Volume2 } from "lucide-react"
import { Trash2 } from "lucide-react"
import { getAuthStatus } from "@/lib/auth-utils"

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

// Change from const to let to make it mutable
export let aiModels: AIModel[] = []

// Add a function to add new models
export const addNewModel = (newModel: AIModel) => {
  aiModels = [...aiModels, newModel];
  return newModel;
}

export function AIModelManager() {
  const [playingModel, setPlayingModel] = useState<number | null>(null)
  const [models, setModels] = useState<AIModel[]>(aiModels)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const { userProfile } = getAuthStatus();

        let userModels: AIModel[] = [];
        if (userProfile?.email && userProfile.email !== 'admin@tennyvoice.com') {
          // 1) 사용자 모델 먼저 요청
          const userResponse = await fetch(`/api/models?email=${userProfile.email}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userModels = userData.map((model: any, index: number) => ({
              id: index + 1,
              _id: model._id,
              name: model.name,
              type: model.type,
              quality: model.quality,
              description: model.description,
              avatar: model.avatar || "/placeholder.svg?height=40&width=40",
              isDefault: model.isDefault || false,
              createdAt: new Date(model.createdAt).toLocaleDateString(),
              usageCount: model.usageCount || 0,
              url: model.modelUrl,
            }));
          }
        }

        // 2) admin 모델 요청
        const adminResponse = await fetch(`/api/models?email=admin@tennyvoice.com`);
        let adminModels: AIModel[] = [];
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          adminModels = adminData.map((model: any, index: number) => ({
            id: userModels.length + index + 1,
            _id: model._id,
            name: model.name,
            type: model.type,
            quality: model.quality,
            description: model.description,
            avatar: model.avatar || "/placeholder.svg?height=40&width=40",
            isDefault: model.isDefault || false,
            createdAt: new Date(model.createdAt).toLocaleDateString(),
            usageCount: model.usageCount || 0,
            url: model.modelUrl,
          }));
        }

        // 3) 둘 합치기 (userModels 먼저, adminModels 뒤에)
        const allModels = [...userModels, ...adminModels];

        setModels(allModels);
        console.log("사용자 모델:", userModels);
        console.log("관리자 모델:", adminModels);
        console.log("합친 모델 목록:", allModels);

      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    };

    fetchModels();
  }, []);


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

      // 선택된 모델 찾기
      const selectedModel = models.find(model => model.id === modelId);
      if (!selectedModel) {
        console.error("선택한 모델을 찾을 수 없습니다.");
        return;
      }

      // 서버에 기본 모델 설정 요청
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

      // 선택된 모델만 isDefault를 true로, 나머지는 false로 설정
      setModels(currentModels =>
        currentModels.map(model => ({
          ...model,
          isDefault: model.id === modelId,
        }))
      );
    } catch (error) {
      console.error("기본 모델 설정 중 오류 발생:", error);
    }
  };

  const handleDelete = (modelId: number) => {
    if (window.confirm("이 모델을 정말 삭제하시겠습니까?")) {
      setModels(currentModels => currentModels.filter(model => model.id !== modelId));
      // console.log("모델 삭제 (API 호출 필요):", modelId);
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
                  className={`${model.isDefault
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
