"use client"

import { AIModelManager } from "@/components/ai-model-manager"
import { VoiceCloningStudio } from "@/components/voice-cloning-studio"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Lock, LogIn } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect, Suspense } from "react"

function AIModelsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoggedIn } = useAuth()
  const [activeTab, setActiveTab] = useState("models")

  // URL의 tab 파라미터가 변경될 때 activeTab 상태 업데이트
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleLoginRedirect = () => {
    router.push('/auth/login')
  }

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-onair-bg/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center p-6 bg-onair-bg-sub rounded-lg border border-onair-text-sub/20 max-w-sm mx-4">
          <Lock className="w-12 h-12 text-onair-mint mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-onair-text mb-2">
            로그인이 필요합니다
          </h3>
          <p className="text-onair-text-sub text-sm mb-4">
            AI 모델을 관리하려면 로그인해주세요
          </p>
          <Button 
            onClick={handleLoginRedirect}
            className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
          >
            <LogIn className="w-4 h-4 mr-2" />
            로그인하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-onair-mint">AI 모델 관리</h1>
        <p className="text-onair-text-sub">다양한 AI 음성 모델을 관리하고 보이스 클로닝에서 새로운 모델을 생성하세요</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-onair-bg-sub max-w-md mx-auto">
          <TabsTrigger value="models" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">
            내 AI 모델
          </TabsTrigger>
          <TabsTrigger value="cloning" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">
            보이스 클로닝
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <AIModelManager />
        </TabsContent>

        <TabsContent value="cloning">
          <VoiceCloningStudio onSaveSuccess={() => setActiveTab("models")} />
        </TabsContent>
      </Tabs>
      {/* 스크롤 버튼 */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-10 h-10 rounded-full bg-onair-mint text-white flex items-center justify-center shadow-lg hover:bg-onair-mint/90 transition-colors"
          aria-label="맨 위로 스크롤"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="w-10 h-10 rounded-full bg-onair-mint text-white flex items-center justify-center shadow-lg hover:bg-onair-mint/90 transition-colors"
          aria-label="맨 아래로 스크롤"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function AIModelsPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <AIModelsContent />
    </Suspense>
  )
}
