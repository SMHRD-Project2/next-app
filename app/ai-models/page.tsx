"use client"

import { AIModelManager } from "@/components/ai-model-manager"
import { VoiceCloningStudio } from "@/components/voice-cloning-studio"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Lock, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function AIModelsPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()

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
        <p className="text-onair-text-sub">다양한 AI 음성 모델을 관리하고 새로운 보이스를 생성하세요</p>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
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
          <VoiceCloningStudio />
        </TabsContent>
      </Tabs>
    </div>
  )
}
