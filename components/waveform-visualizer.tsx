"use client"

import { useEffect, useState } from "react"

export function WaveformVisualizer() {
  const [isAnimating, setIsAnimating] = useState(false)
  const [tick, setTick] = useState(0)
  const [staticHeights, setStaticHeights] = useState<number[]>([])

  useEffect(() => {
    setIsAnimating(true)

    // static height 배열 생성 (CSR에서만)
    setStaticHeights(
      Array.from({ length: 40 }).map(() => 0.1 + Math.random() * 0.1)
    )

    const stopTimer = setTimeout(() => {
      setIsAnimating(false)
    }, 10000)

    const interval = setInterval(() => {
      setTick(prev => prev + 1)
    }, 100)

    return () => {
      clearTimeout(stopTimer)
      clearInterval(interval)
    }
  }, [])

  // staticHeights가 아직 준비 안 됐을 때는 렌더링 보류
  if (staticHeights.length === 0) return null

  return (
    <div className="flex items-center h-8 flex-grow bg-onair-bg rounded-md overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => {
        const baseHeight = Math.sin(i * 0.2) * 0.5 + 0.5
        const animatedHeight = isAnimating
          ? baseHeight * (0.5 + Math.sin((tick + i * 5) / 10) * 0.5)
          : staticHeights[i]

        return (
          <div
            key={i}
            className="bg-onair-mint/60 mx-px rounded-full transition-all duration-100"
            style={{
              height: `${animatedHeight * 100}%`,
              width: "2px",
            }}
          />
        )
      })}
    </div>
  )
}
