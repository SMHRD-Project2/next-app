"use client"

import { useEffect, useState } from "react"

export function WaveformVisualizer() {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)

    // 10초 후에 애니메이션 중지 (실제로는 오디오 재생 완료 시 중지)
    const timer = setTimeout(() => {
      setIsAnimating(false)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex items-center h-8 flex-grow bg-onair-bg rounded-md overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => {
        const height = Math.sin(i * 0.2) * 0.5 + 0.5
        const animatedHeight = isAnimating ? height : 0.1 + Math.random() * 0.1

        return (
          <div
            key={i}
            className="bg-onair-mint/60 mx-px rounded-full transition-all duration-100"
            style={{
              height: `${animatedHeight * 100}%`,
              width: "2px",
              animationDelay: `${i * 0.05}s`,
              transform: isAnimating ? `scaleY(${0.5 + Math.sin(Date.now() / 200 + i * 0.5) * 0.5})` : "scaleY(1)",
            }}
          />
        )
      })}
    </div>
  )
}
