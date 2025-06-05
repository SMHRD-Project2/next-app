import { AIModelManager } from "@/components/ai-model-manager"
import { VoiceCloningStudio } from "@/components/voice-cloning-studio"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AIModelsPage() {
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
