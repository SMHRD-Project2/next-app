"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Square, ArrowRight } from "lucide-react"

interface RecordControllerProps {
  isRecording: boolean
  onRecord: () => void
  hasRecorded: boolean
  onNext: () => void
  canNext: boolean
}

export function RecordController({ isRecording, onRecord, hasRecorded, onNext, canNext }: RecordControllerProps) {
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

          <div className="flex justify-center gap-4">
            <Button
              onClick={onRecord}
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
