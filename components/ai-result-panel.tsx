"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Lock, LogIn } from "lucide-react"
import { useEffect, useState } from "react"
import { getAuthStatus } from "@/lib/auth-utils"

export const defaultAIResults = {
  pronunciation: 85,
  intonation: 78,
  tone: 92,
  stability: 88,
}

export function AIResultPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // 클라이언트에서만 로그인 상태 확인
    if (typeof window !== "undefined") {
      const { isLoggedIn: loggedIn } = getAuthStatus()
      setIsLoggedIn(loggedIn)
    }

    // 로그인 상태 변경 감지
    const handleAuthChange = () => {
      if (typeof window !== "undefined") {
        const { isLoggedIn: loggedIn } = getAuthStatus()
        setIsLoggedIn(loggedIn)
      }
    }

    window.addEventListener('localStorageChange', handleAuthChange)
    return () => window.removeEventListener('localStorageChange', handleAuthChange)
  }, [])

  const results = defaultAIResults

  const feedback = [
    { type: "good", text: "전체적인 발음이 명확합니다" },
    { type: "improve", text: "'습니다' 부분의 억양을 더 자연스럽게 해보세요" },
    { type: "tip", text: "문장 끝에서 톤을 살짝 낮춰보세요" },
  ]

  const handleLoginRedirect = () => {
    window.location.href = "/auth/login"
  }

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20 relative">
      <CardHeader>
        <CardTitle className="text-onair-text">AI 분석 결과</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 점수 */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(results).map(([key, value]) => {
            const labels = {
              pronunciation: "발음 정확도",
              intonation: "억양",
              tone: "톤",
              stability: "안정성",
            }

            const getColor = (score: number) => {
              if (score >= 90) return "text-onair-mint"
              if (score >= 80) return "text-onair-orange"
              return "text-red-400"
            }

            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-onair-text-sub text-sm">{labels[key as keyof typeof labels]}</span>
                  <span className={`font-semibold ${getColor(value)}`}>{value}점</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            )
          })}
        </div>

        {/* 피드백 */}
        <div className="space-y-3">
          <h4 className="font-semibold text-onair-text">상세 피드백</h4>
          {feedback.map((item, index) => {
            const colors = {
              good: "bg-onair-mint/10 text-onair-mint border-onair-mint/20",
              improve: "bg-onair-orange/10 text-onair-orange border-onair-orange/20",
              tip: "bg-onair-blue/10 text-onair-blue border-onair-blue/20",
            }

            return (
              <div key={index} className={`p-3 rounded-lg border ${colors[item.type as keyof typeof colors]}`}>
                <p className="text-sm">{item.text}</p>
              </div>
            )
          })}
        </div>
      </CardContent>

      {/* 비회원 블러 처리 오버레이 */}
      {!isLoggedIn && (
        <div className="absolute inset-0 bg-onair-bg/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center p-6 bg-onair-bg-sub rounded-lg border border-onair-text-sub/20 max-w-sm mx-4">
            <Lock className="w-12 h-12 text-onair-mint mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-onair-text mb-2">
              로그인이 필요합니다
            </h3>
            <p className="text-onair-text-sub text-sm mb-4">
              AI 분석 결과를 확인하려면 로그인해주세요
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
      )}
    </Card>
  )
}
