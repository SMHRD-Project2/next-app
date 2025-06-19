"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Square, ArrowRight, Play, Download } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { LoadingMessage } from "@/components/loading-message"

interface RecordControllerProps {
  isRecording: boolean
  onRecord: () => void
  hasRecorded: boolean
  onNext: () => void
  canNext: boolean
}

export function RecordController({ isRecording, onRecord, hasRecorded, onNext, canNext }: RecordControllerProps) {
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [waveHeights, setWaveHeights] = useState<number[]>([])
  const [isClient, setIsClient] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 클라이언트 마운트 확인 및 랜덤 높이 생성
    setIsClient(true)
    const heights = Array.from({ length: 20 }, () => Math.random() * 40 + 20)
    setWaveHeights(heights)

    // 오디오 엘리먼트 생성
    audioRef.current = new Audio()

    // 오디오 재생 종료 이벤트 처리
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
      })

      audioRef.current.addEventListener('error', (e) => {
        console.error('오디오 재생 오류:', e)
        setIsPlaying(false)
      })
    }

    return () => {
      // 클린업: blob URL 해제
      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
    }
  }, [])

  // 녹음 시작 버튼 누르면 녹음 시작
  const handleRecord = async () => {
    if (!isRecording) {
      try {
        let stream;
        
        try {
          // 먼저 실제 마이크로 시도
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
          // console.log("마이크 접근 실패, 가상 오디오 스트림 생성 시도");
          // 마이크 접근 실패 시 가상 오디오 스트림 생성
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const destination = audioContext.createMediaStreamDestination();
          oscillator.connect(destination);
          oscillator.start();
          stream = destination.stream;
        }

        // 지원되는 MIME 타입 확인
        let mimeType = 'audio/webm;codecs=opus'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm'
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4'
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = '' // 브라우저 기본값 사용
            }
          }
        }

        const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        // 녹음 완료 시 처리
        mediaRecorder.onstop = async () => {
          console.log("mediaRecorder onstop 이벤트 발생");
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType || 'audio/webm'
          })

          // 이전 URL이 있다면 해제
          if (audioURL) {
            URL.revokeObjectURL(audioURL)
          }

          const url = URL.createObjectURL(audioBlob)
          setAudioURL(url)

          // 녹음 종료 시
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          setRecordingTime(0)

          // 서버로 녹음 파일 전송
          try {
            console.log("[DEBUG] 녹음 파일 서버 전송 시작");
            const formData = new FormData();
            const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
            formData.append("file", file);

            console.log("[DEBUG] FormData 생성됨:", {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_PY_URL}/upload_model`, {
              method: "POST",
              body: formData,
            });

            console.log("[DEBUG] 서버 응답 받음:", response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error("[ERROR] 서버 응답 오류:", errorText);
              throw new Error(`서버 응답 오류: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log("[DEBUG] 서버 응답 데이터:", data);

            if (data.success) {
              console.log("[DEBUG] 파일 업로드 성공:", data.url);
            } else {
              console.error("[ERROR] 파일 업로드 실패:", data.error);
            }
          } catch (error) {
            console.error("[ERROR] 파일 업로드 중 오류 발생:", error);
          }
        }

        mediaRecorder.start()
        console.log("이벤트 발생");
        onRecord()

        // 타이머 시작
        setRecordingTime(0)
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } catch (err) {
        console.error('녹음 권한을 얻을 수 없습니다:', err)
        alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 확인해주세요.')
      }
    } else {
      // 녹음 중지
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      onRecord()
    }
  }

  // 재생 버튼 클릭 처리
  const handlePlay = async () => {
    if (audioRef.current && audioURL) {
      try {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          audioRef.current.src = audioURL
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (err) {
        console.error('재생 오류:', err)
        setIsPlaying(false)
      }
    }
  }

  // 다운로드 기능
  const handleDownload = () => {
    if (audioURL) {
      const a = document.createElement('a')
      a.href = audioURL
      a.download = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }


  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-onair-text">
            {isRecording ? "녹음 중..." : hasRecorded ? "녹음 완료!" : "음성 녹음"}
          </h3>

          {isRecording && (
            <>
              <div className="flex items-center justify-center space-x-1 h-16">
                {isClient && waveHeights.length > 0 ? (
                  waveHeights.map((height, i) => (
                    <div
                      key={i}
                      className="bg-onair-orange rounded-full animate-wave"
                      style={{
                        width: "4px",
                        height: `${height}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))
                ) : (
                  // SSR 및 초기 로딩 시 정적 높이 사용
                  Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-onair-orange rounded-full animate-wave"
                      style={{
                        width: "4px",
                        height: "30px", // 고정 높이
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))
                )}
              </div>
              <p className="text-onair-text-sub text-sm mt-2">
                {` ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`}
              </p>
            </>
          )}

          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={handleRecord}
              size="lg"
              className={`${isRecording
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
                } font-semibold`}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  녹음 중지
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  {hasRecorded ? "다시 녹음" : "녹음 시작"}
                </>
              )}
            </Button>

            {hasRecorded && !isRecording && audioURL && (
              <div className="flex gap-2">
                <Button
                  onClick={handlePlay}
                  size="lg"
                  variant="outline"
                  className="border-onair-blue text-onair-blue hover:bg-onair-blue hover:text-onair-bg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isPlaying ? "일시정지" : "재생"}
                </Button>
                <Button
                  onClick={handleDownload}
                  size="lg"
                  variant="outline"
                  className="border-onair-blue text-onair-blue hover:bg-onair-blue hover:text-onair-bg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  다운로드
                </Button>
              </div>
            )}
          </div>

          {hasRecorded && !isRecording && <LoadingMessage />}
        </div>
      </CardContent>
    </Card>
  )
}
