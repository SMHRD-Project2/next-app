"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar, TrendingUp, Award, Lock, LogIn, Trash2, Play, Pause, Eye, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect, useRef } from "react"
import { getAuthStatus } from "@/lib/auth-utils"
import { AIResultPanel } from "@/components/ai-result-panel"

export default function HistoryPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [trainingRecords, setTrainingRecords] = useState<any[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("전체") // 새로운 상태 추가
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDropdown])

  const categories = [
    "전체",
    "짧은 문장",
    "긴 문장",
    "뉴스 읽기",
    "내문장 업로드",
    "발음 챌린지"
  ]

  // 필터링 로직 수정
  const filteredRecords = selectedCategory === "전체" 
    ? trainingRecords 
    : trainingRecords.filter(record => record.category === selectedCategory)

  // 평균 정확도 계산
  const calculateAverageAccuracy = () => {
    if (trainingRecords.length === 0) {
      return 0
    }

    let totalScoreSum = 0
    let validRecords = 0

    trainingRecords.forEach(record => {
      if (record.analysisResult && record.analysisResult.overallScore) {
        // 새로운 AI 분석 결과 구조
        totalScoreSum += record.analysisResult.overallScore
        validRecords++
      } else if (record.scores) {
        // 기존 점수 구조 (하위 호환성)
        const { pronunciation, intonation, tone } = record.scores
        if (pronunciation && intonation && tone) {
          const itemAverage = (pronunciation + intonation + tone) / 3
          totalScoreSum += itemAverage
          validRecords++
        }
      }
    })

    return validRecords > 0 ? Math.round(totalScoreSum / validRecords) : 0
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
    router.push(`/training?customSentence=${encodeURIComponent(sentence)}&tab=custom&scroll=true`)
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

  // 더보기 버튼 핸들러 수정
  const handleViewDetails = (recordId: string) => {
    const wasOpen = selectedRecordId === recordId;
    setSelectedRecordId(prev => prev === recordId ? null : recordId)
    
    // 패널이 열릴 때만 스크롤 조정 (닫힐 때는 조정하지 않음)
    if (!wasOpen) {
      // 다음 렌더링 사이클에서 스크롤 조정을 위해 setTimeout 사용
      setTimeout(() => {
        const element = document.getElementById(`record-${recordId}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
          
          // 요소가 뷰포트에 완전히 보이지 않는 경우에만 스크롤 조정
          if (!isInViewport) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }
      }, 100); // 패널이 렌더링될 시간을 주기 위해 약간의 지연
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-onair-mint">훈련 기록</h1>
        <p className="text-onair-text-sub">훈련 기록을 관리하고 성장 과정을 확인해보세요</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-onair-bg-sub border-onair-text-sub/20">
          <CardContent className="p-3 md:p-6 text-center">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-onair-mint mx-auto mb-1 md:mb-2" />
            <h3 className="text-lg md:text-2xl font-bold text-onair-text">15일</h3>
            <p className="text-[13px] md:text-sm text-onair-text-sub">총 훈련 일수</p>
          </CardContent>
        </Card>

        <Card className="bg-onair-bg-sub border-onair-text-sub/20">
          <CardContent className="p-3 md:p-6 text-center">
            <Award className="w-6 h-6 md:w-8 md:h-8 text-onair-blue mx-auto mb-1 md:mb-2" />
            <h3 className="text-lg md:text-2xl font-bold text-onair-text">{trainingRecords.length}개</h3>
            <p className="text-[13px] md:text-sm text-onair-text-sub">훈련 갯수</p>
          </CardContent>
        </Card>

        <Card className="bg-onair-bg-sub border-onair-text-sub/20">
          <CardContent className="p-3 md:p-6 text-center">
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-onair-orange mx-auto mb-1 md:mb-2" />
            <h3 className="text-lg md:text-2xl font-bold text-onair-text">{averageAccuracy}%</h3>
            <p className="text-[13px] md:text-sm text-onair-text-sub">평균 정확도</p>
          </CardContent>
        </Card>
      </div>

      {/* 훈련 기록 */}
      <Card className="bg-onair-bg-sub border-onair-text-sub/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-onair-mint" />
              <h2 className="text-lg font-semibold text-onair-text">훈련 기록</h2>
            </div>
            {/* 드롭다운 필터 수정 */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-onair-bg-sub border border-gray-600 text-onair-white text-sm shadow-sm hover:bg-white/20 hover:shadow-md transition-all duration-200 ease-in-out"
                onClick={() => setShowDropdown(v => !v)}
                type="button"
              >
                {selectedCategory}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`absolute right-0 mt-2 w-40 bg-onair-bg-sub border border-gray-600 rounded-lg shadow-xl z-20 overflow-hidden transition-all duration-200 ease-in-out
                  ${showDropdown ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
                `}
              >
                {categories.map(category => (
                  <button
                    key={category}
                    className={`block w-full text-left px-4 py-2 text-sm transition-all duration-100
                      ${selectedCategory === category
                        ? "bg-white/10 text-white font-semibold"
                        : "text-onair-text hover:bg-white/10 hover:text-white"}
                    `}
                    onClick={() => {
                      setSelectedCategory(category)
                      setShowDropdown(false)
                    }}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {filteredRecords.map((item) => {
              const getScoreColor = (score: number) => {
                if (score >= 90) return "text-onair-mint"
                if (score >= 80) return "text-onair-orange"
                return "text-red-400"
              }

              const getCategoryColor = (category: string) => {
                switch (category) {
                  case "뉴스 읽기":
                    return "bg-onair-blue/10 text-onair-blue"
                  case "긴 문장":
                    return "bg-onair-orange/10 text-onair-orange"
                  case "짧은 문장":
                    return "bg-onair-mint/10 text-onair-mint"
                  case "발음 챌린지":
                    return "bg-onair-red/20 text-red-400"
                  case "내문장 업로드":
                    return "bg-white/10 text-gray"

                }
              }

              // 현재 항목이 재생 중인지 확인
              const isThisItemPlaying = currentPlayingId === item._id;
              const isDetailOpen = selectedRecordId === item._id;

              return (
                <div 
                  key={item._id} 
                  id={`record-${item._id}`}
                  className="p-4 bg-onair-bg rounded-lg border border-onair-text-sub/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-onair-text-sub text-sm">{item.date}</span>
                    </div>
                    {/* 모바일에서만 삭제 버튼 표시 - 오른쪽 정렬 */}
                    <div className="sm:hidden flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item._id) }}
                        className="px-2 py-1 text-xs border border-onair-text-sub/20 text-onair-text-sub hover:text-red-400 hover:bg-onair-bg-sub rounded flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        삭제
                      </button>
                    </div>
                  </div>

                  {/* 문장 */}
                  <p className="text-onair-text">{item.sentence}</p>

                  {/* 점수 */}
                  <div className="flex items-center gap-6">
                    {item.analysisResult ? (
                      // 새로운 AI 분석 결과 구조
                      <>
                        <div className="text-center">
                          <p className="text-onair-text-sub text-xs">전체 점수</p>
                          <p className={`font-semibold ${getScoreColor(item.analysisResult.overallScore)}`}>
                            {item.analysisResult.overallScore?.toFixed(1) || 'N/A'}
                          </p>
                        </div>
                        {item.analysisResult.items && item.analysisResult.items.slice(0, 3).map((item: any, index: number) => (
                          <div key={index} className="text-center">
                            <p className="text-onair-text-sub text-xs">
                              {item.metric === 'pronunciation' ? '발음' : 
                               item.metric === 'intonation' ? '억양' : 
                               item.metric === 'rhythm' ? '리듬' : 
                               item.metric === 'pitch' ? '음높이' :
                               item.metric === 'stress' ? '강세' :
                               item.metric}
                            </p>
                            <p className={`font-semibold ${getScoreColor(item.score)}`}>
                              {item.score?.toFixed(1) || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </>
                    ) : (
                      // 기존 점수 구조 (하위 호환성)
                      <>
                        <div className="text-center">
                          <p className="text-onair-text-sub text-xs">발음</p>
                          <p className={`font-semibold ${getScoreColor(item.scores?.pronunciation || 0)}`}>
                            {item.scores?.pronunciation || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-onair-text-sub text-xs">억양</p>
                          <p className={`font-semibold ${getScoreColor(item.scores?.intonation || 0)}`}>
                            {item.scores?.intonation || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-onair-text-sub text-xs">톤</p>
                          <p className={`font-semibold ${getScoreColor(item.scores?.tone || 0)}`}>
                            {item.scores?.tone || 'N/A'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {/* 음성 재생 버튼 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleAudioPlayback(item._id, item) }}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs sm:text-sm border border-onair-text-sub/20 text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub rounded flex items-center gap-1 transition-colors"
                      >
                        {isThisItemPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        <span className="hidden sm:inline">{isThisItemPlaying ? "일시정지" : "음성 재생"}</span>
                        <span className="sm:hidden">{isThisItemPlaying ? "정지" : "재생"}</span>
                      </button>
                      {/* 더보기 버튼 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(item._id) }}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs sm:text-sm border border-onair-text-sub/20 text-onair-text-sub hover:text-onair-mint hover:bg-onair-bg-sub rounded flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{isDetailOpen ? "닫기" : "더보기"}</span>
                        <span className="sm:hidden">{isDetailOpen ? "닫기" : "더보기"}</span>
                      </button>
                      {/* 다시 훈련 버튼 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRetrain(item.sentence) }}
                        className="px-3 py-1.5 sm:px-3 sm:py-1 text-xs sm:text-sm bg-onair-mint text-onair-bg hover:bg-onair-mint/90 rounded flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="hidden sm:inline">다시 훈련</span>
                        <span className="sm:hidden">다시 훈련</span>
                      </button>
                    </div>
                    {/* 데스크톱에서만 삭제 버튼 표시 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item._id) }}
                      className="hidden sm:flex px-3 py-1 text-sm border border-onair-text-sub/20 text-onair-text-sub hover:text-red-400 hover:bg-onair-bg-sub rounded items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                  {/* AI 분석 결과 패널: 카드 내부에 조건부 렌더링 */}
                  {isDetailOpen && (
                    <div className="mt-4">
                      <AIResultPanel
                        myVoiceUrl={item.voiceUrl}
                        referenceUrl={item.referenceUrl}
                        userRecordingUrl={item.userRecordingUrl}
                        analysisResult={item.analysisResult || item.scores}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            {filteredRecords.length === 0 && (
              <div className="text-center text-onair-text-sub py-8 text-sm">
                {selectedCategory === "전체" ? "훈련 기록이 없습니다." : `${selectedCategory} 카테고리의 기록이 없습니다.`}
              </div>
            )}
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