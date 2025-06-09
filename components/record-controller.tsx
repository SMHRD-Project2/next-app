"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Square, ArrowRight, Play, Download } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface RecordControllerProps {
  isRecording: boolean
  onRecord: () => void
  hasRecorded: boolean
  onNext: () => void
  canNext: boolean
}

export function RecordController({ isRecording, onRecord, hasRecorded, onNext, canNext }: RecordControllerProps) {
  // 녹음 기능 추가~ 녹음 중지 버튼 누르면 녹음 완료 버튼 생성
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // 오디오 엘리먼트 생성
    audioRef.current = new Audio()
    
    // 녹음 중지 시 처리
    if (!isRecording && mediaRecorderRef.current) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' })
      const url = URL.createObjectURL(audioBlob)
      setAudioURL(url)
      audioChunksRef.current = []
    }
  }, [isRecording])

  // 녹음 시작 버튼 누르면 녹음 시작
  const handleRecord = async () => {
    if (!isRecording) {
      try {
        // HTTP 환경에서도 작동하도록 설정
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        })
        
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.start()
        onRecord()
      } catch (err) {
        console.error('녹음 권한을 얻을 수 없습니다:', err)
        alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 확인해주세요.')
      }
    } else {
      mediaRecorderRef.current?.stop()
      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
      onRecord()
    }
  }

  // 녹음 중지 버튼 누르면 녹음 완료 버튼 생성
  const handlePlay = () => {
    if (audioRef.current && audioURL) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.src = audioURL
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // wav 파일 다운로드 기능 추가
  const handleDownload = () => {
    if (audioURL) {
      const a = document.createElement('a')
      a.href = audioURL
      a.download = `recording-${new Date().toISOString()}.mp3`
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
            <div className="flex items-center justify-center space-x-1 h-16">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-onair-orange rounded-full animate-wave"
                  style={{
                    width: "4px",
                    height: `${Math.random() * 40 + 20}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={handleRecord}
              size="lg"
              className={`${
                isRecording
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

            {hasRecorded && audioURL && (
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

            {hasRecorded && canNext && (
              <Button
                onClick={onNext}
                size="lg"
                variant="outline"
                className="border-onair-blue text-onair-blue hover:bg-onair-blue hover:text-onair-bg"
              >
                다음 문장
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>

          {hasRecorded && <p className="text-onair-text-sub text-sm">AI가 발음을 분석하고 있습니다...</p>}
        </div>
      </CardContent>
    </Card>
  )
}
