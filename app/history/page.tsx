"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar, TrendingUp, Award, Lock, LogIn, Trash2, Play, Pause } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect, useRef } from "react"
import { getAuthStatus } from "@/lib/auth-utils"

export default function HistoryPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [trainingRecords, setTrainingRecords] = useState<any[]>([])

  // 이전 버전의 상태 관리
  // const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null)
  // const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  // 현재 재생 중인 항목의 ID를 추적 (null이면 재생 중인 항목 없음)
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null)
  // Audio 객체를 저장할 useRef. 컴포넌트 리렌더링 시에도 객체 유지.
  const audioInstanceRef = useRef<HTMLAudioElement | null>(null)

  // 오디오 재생 토글 함수
  const toggleAudioPlayback = (id: string, item: any) => {
    // 만약 현재 재생 중인 항목이 있고, 그 항목이 방금 클릭한 항목이 아니라면, 기존 재생을 중지합니다.
    if (audioInstanceRef.current && currentPlayingId !== null && currentPlayingId !== id) {
      audioInstanceRef.current.pause()
      audioInstanceRef.current.currentTime = 0 // 처음으로 되감기
      // console.log(`[${currentPlayingId}] 이전 오디오 중지됨.`)
      setCurrentPlayingId(null) // 이전 재생 상태 초기화
    }

    // 클릭된 항목의 재생 상태를 토글합니다.
    if (currentPlayingId === id) {
      // 이 항목이 현재 재생 중이라면, 정지합니다.
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause()
        audioInstanceRef.current.currentTime = 0
        // console.log(`[${id}] 오디오 정지됨.`)
      }
      setCurrentPlayingId(null) // 재생 상태를 null로 설정
    } else {
      // 이 항목이 재생 중이 아니라면, 재생을 시작합니다.
      // Audio 객체가 아직 없다면 새로 생성합니다.
      if (!audioInstanceRef.current) {
        audioInstanceRef.current = new Audio(item.voiceUrl)
        // console.log('새 Audio 객체 생성됨: /audio/female.wav')

        // Audio 객체의 이벤트 리스너를 한 번만 설정
        audioInstanceRef.current.onended = () => {
          // console.log(`[${currentPlayingId}] 오디오 재생 완료됨.`)
          setCurrentPlayingId(null) // 재생 완료 시 상태 초기화
        }
        audioInstanceRef.current.onerror = (e) => {
          console.error(`[${currentPlayingId}] 오디오 로드 또는 재생 중 에러 발생:`, e)
          setCurrentPlayingId(null) // 에러 발생 시 상태 초기화
        }
      } else {
        // 기존 Audio 객체가 있다면, 재생 위치를 처음으로 되감습니다.
        audioInstanceRef.current.currentTime = 0
        audioInstanceRef.current.src = item.voiceUrl // 새로운 URL로 업데이트
        // console.log('기존 Audio 객체 재사용.')
      }

      // 오디오 재생 시도
      audioInstanceRef.current.play().then(() => {
        // console.log(`[${id}] 오디오 재생 시작됨.`)
        setCurrentPlayingId(id) // 재생 시작 시 현재 ID로 업데이트
      }).catch(error => {
        console.error(`[${id}] audio.play() Promise 에러:`, error)
        setCurrentPlayingId(null) // Promise 에러 시 상태 초기화
      })
    }
  }

  // 이전 버전의 데이터 로딩 로직
  useEffect(() => {
    if (isLoggedIn) {
      const fetchRecords = async () => {
        try {
          const { userProfile } = getAuthStatus()
          if (!userProfile?.email) {
            console.error('User email not found')
            return
          }

          const res = await fetch(`/api/training-records?email=${userProfile.email}`)
          if (res.ok) {
            const data = await res.json()
            setTrainingRecords(data)
          }
        } catch (err) {
          console.error('Failed to load records', err)
        }
      }
      fetchRecords()
    }
  }, [isLoggedIn])

  // 컴포넌트 언마운트 시 오디오 정리
  useEffect(() => {
    return () => {
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause()
        audioInstanceRef.current.currentTime = 0
      }
    }
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
    // Navigate to training page with the sentence as a query parameter and custom tab
    router.push(`/training?customSentence=${encodeURIComponent(sentence)}&tab=custom`)
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

  // 이전 버전의 오디오 재생 토글 함수
  // const toggleAudioPlayback = (id: string) => {    
  //   if (currentPlayingId === id) {
  //     // 현재 재생 중인 오디오 정지
  //     if (audioElement) {
  //       audioElement.pause()
  //       audioElement.currentTime = 0
  //     }
  //     setCurrentPlayingId(null)
  //   } else {
  //     // 새로운 오디오 재생
  //     if (audioElement) {
  //       audioElement.pause()
  //     }
  //     const newAudio = new Audio(`/api/audio/${id}`)
  //     newAudio.play()
  //     setAudioElement(newAudio)
  //     setCurrentPlayingId(id)
  //   }
  // }

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

              // 현재 항목이 재생 중인지 확인
              const isThisItemPlaying = currentPlayingId === item._id;

              return (
                <div key={item._id} className="p-4 bg-onair-bg rounded-lg border border-onair-text-sub/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-onair-text-sub text-sm">{item.date}</span>
                    </div>
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
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleAudioPlayback(item._id, item) }}
                        className="px-3 py-1 text-sm border border-onair-text-sub/20 text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub rounded flex items-center gap-1"
                      >
                        {isThisItemPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isThisItemPlaying ? "일시정지" : "음성 재생"}
                      </button>
                      {/* 다시 훈련 버튼 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRetrain(item.sentence) }}
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
                      onClick={(e) => { e.stopPropagation(); handleDelete(item._id) }}
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