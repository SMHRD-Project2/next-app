"use client"

import { useSearchParams } from "next/navigation"
import { TrainingTabs } from "@/components/training-tabs"

export default function TrainingPage() {
  const searchParams = useSearchParams()
  const customSentence = searchParams.get("customSentence")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-onair-mint">훈련실</h1>
        <p className="text-onair-text-sub">다양한 유형의 발음 훈련으로 실력을 향상시켜보세요</p>
      </div>

      <TrainingTabs initialCustomSentence={customSentence} />
    </div>
  )
}
