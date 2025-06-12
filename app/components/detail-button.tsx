'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"

export function DetailButton() {
  const router = useRouter()

  return (
    <Button 
      size="sm" 
      variant="ghost" 
      className="text-onair-text-sub hover:text-onair-text"
      onClick={() => router.push('/training-history-list')}
    >
      상세 보기
    </Button>
  )
} 