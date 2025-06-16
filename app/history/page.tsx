"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar, TrendingUp, Award, Lock, LogIn, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect } from "react"

export default function HistoryPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [trainingRecords, setTrainingRecords] = useState<any[]>([])

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch('/api/training-records')
        if (res.ok) {
          const data = await res.json()
          setTrainingRecords(data)
        }
      } catch (err) {
        console.error('Failed to load records', err)
      }
    }
    fetchRecords()
  }, [])

  // 평균 정확도 계산
  const calculateAverageAccuracy = () => {
    if (trainingRecords.length === 0) {
      return 0
    }

    let totalScoreSum = 0
    trainingRecords.forEach(record => {
      const { pronunciation, intonation, tone } = record.scores
      const itemAverage = (pronunciation + intonation + tone) / 3
      totalScoreSum += itemAverage
    })

    return Math.round(totalScoreSum / trainingRecords.length)
  }

  const averageAccuracy = calculateAverageAccuracy()

  const handleLoginRedirect = () => {
    router.push('/login')
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
            훈련 기록을 확인하려면 로그인해주세요
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

  const handleRetrain = (sentence: string) => {
    // Navigate to training page with the sentence as a query parameter
    router.push(`/training?customSentence=${encodeURIComponent(sentence)}`)
  }

  // 삭제 핸들러 추가
  const handleDelete = async (id: string) => {
    if (confirm("정말로 이 기록을 삭제하시겠습니까?")) {
      try {
        await fetch(`/api/training-records?id=${id}`, { method: 'DELETE' })
        setTrainingRecords(prev => prev.filter(record => record._id !== id))
        alert("기록이 삭제되었습니다.")
      } catch (err) {
        console.error('Failed to delete record', err)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-onair-mint">훈련 기록</h1>
        <p className="text-onair-text-sub">훈련 기록을 관리하고 성장 과정을 확인해보세요</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-onair-bg-sub border-onair-text-sub/20">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-onair-mint mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-onair-text">15일</h3>
            <p className="text-onair-text-sub">총 훈련 일수</p>
          </CardContent>
        </Card>

        <Card className="bg-onair-bg-sub border-onair-text-sub/20">
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 text-onair-blue mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-onair-text">{trainingRecords.length}개</h3>
            <p className="text-onair-text-sub">훈련 갯수</p>
          </CardContent>
        </Card>

        <Card className="bg-onair-bg-sub border-onair-text-sub/20">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-onair-orange mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-onair-text">{averageAccuracy}%</h3>
            <p className="text-onair-text-sub">평균 정확도</p>

          </CardContent>
        </Card>
      </div>

      {/* 훈련 기록 */}
      <Card className="bg-onair-bg-sub border-onair-text-sub/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-onair-mint" />
            <h2 className="text-xl font-semibold text-onair-text">훈련 기록</h2>
          </div>

          <div className="space-y-4">
            {trainingRecords.map((item) => {
              const getScoreColor = (score: number) => {
                if (score >= 90) return "text-onair-mint"
                if (score >= 80) return "text-onair-orange"
                return "text-red-400"
              }

              const getCategoryColor = (category: string) => {
                switch (category) {
                  case "뉴스 읽기":
                    return "bg-onair-mint/10 text-onair-mint"
                  case "긴 문장":
                    return "bg-onair-orange/10 text-onair-orange"
                  case "짧은 문장":
                    return "bg-onair-blue/10 text-onair-blue"
                  default:
                    return "bg-onair-text-sub/10 text-onair-text-sub"
                }
              }

              return (
                <div key={item._id} className="p-4 bg-onair-bg rounded-lg border border-onair-text-sub/10 space-y-3">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-onair-text-sub text-sm">{item.date}</span>
                    </div>
                    {/* <span className="px-2 py-1 rounded text-xs font-medium border border-onair-mint text-onair-mint">
                      {item.status}
                    </span> */}
                  </div>

                  {/* 문장 */}
                  <p className="text-onair-text">{item.sentence}</p>

                  {/* 점수 */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-onair-text-sub text-xs">발음</p>
                      <p className={`font-semibold ${getScoreColor(item.scores.pronunciation)}`}>
                        {item.scores.pronunciation}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-onair-text-sub text-xs">억양</p>
                      <p className={`font-semibold ${getScoreColor(item.scores.intonation)}`}>
                        {item.scores.intonation}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-onair-text-sub text-xs">톤</p>
                      <p className={`font-semibold ${getScoreColor(item.scores.tone)}`}>{item.scores.tone}</p>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex justify-between items-end">
                    {/* 음성 재생 및 다시 훈련 버튼 그룹 */}
                    <div className="flex gap-2">
                      {/* 음성 재생 버튼 */}
                      <button className="px-3 py-1 text-sm border border-onair-text-sub/20 text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub rounded flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l7-5-7-5z" />
                        </svg>
                        음성 재생
                      </button>
                      {/* 다시 훈련 버튼 */}
                      <button
                        onClick={() => handleRetrain(item.sentence)}
                        className="px-3 py-1 text-sm bg-onair-mint text-onair-bg hover:bg-onair-mint/90 rounded flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                            clipRule="evenodd"
                          />
                        </svg>
                        다시 훈련
                      </button>
                    </div>
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-1 text-sm border border-onair-text-sub/20 text-onair-text-sub hover:text-red-400 hover:bg-onair-bg-sub rounded flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
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