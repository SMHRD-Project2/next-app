"use client"

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react"

/** 부모 컴포넌트에서 사용할 수 있는 메서드 타입 */
export interface WaveformPlayerHandle {
  play: () => void
  pause: () => void
  stop: () => void
  getCurrentTime: () => number | undefined
  setCurrentTime: (t: number) => void
  getDuration: () => number | undefined
}

interface WaveformPlayerProps {
  /** Blob/Object URL 또는 일반 URL */
  url: string | null
  /** 재생 상태 변경 콜백 */
  onPlayStateChange?: (isPlaying: boolean) => void
}

export const WaveformPlayer = forwardRef<WaveformPlayerHandle, WaveformPlayerProps>(
  function WaveformPlayer({ url, onPlayStateChange }, ref) {
    const containerRef   = useRef<HTMLDivElement | null>(null)
    const waveSurferRef  = useRef<any>(null)

    /* ─────────────────────── expose methods to parent ─────────────────────── */
    useImperativeHandle(
      ref,
      () => ({
        play:           () => waveSurferRef.current?.play(),
        pause:          () => waveSurferRef.current?.pause(),
        stop:           () => waveSurferRef.current?.stop(),
        getCurrentTime: () => waveSurferRef.current?.getCurrentTime(),
        setCurrentTime: (t: number) => waveSurferRef.current?.setCurrentTime(t),
        getDuration:    () => waveSurferRef.current?.getDuration(),
      }),
      [],
    )

    /* ───────────────────────────── init & cleanup ─────────────────────────── */
    useEffect(() => {
      if (!url) return

      const existing = document.querySelector(
        "script[data-wavesurfer]",
      ) as HTMLScriptElement | null

      const initWaveSurfer = () => {
        const WaveSurfer = (window as any).WaveSurfer
        if (!WaveSurfer || !containerRef.current) return

        /* 기존 인스턴스 파괴 */
        waveSurferRef.current?.destroy()

        /* 새 인스턴스 생성 */
        waveSurferRef.current = WaveSurfer.create({
          container      : containerRef.current,
          waveColor      : "#1e40af",
          progressColor  : "#10b981",
          height         : 80,
          responsive     : true,
          barWidth       : 2,
        })

        /* 이벤트 리스너 추가 */
        waveSurferRef.current.on('play', () => {
          onPlayStateChange?.(true)
        })

        waveSurferRef.current.on('pause', () => {
          onPlayStateChange?.(false)
        })

        waveSurferRef.current.on('finish', () => {
          onPlayStateChange?.(false)
        })

        waveSurferRef.current.load(url)
      }

      /* wavesurfer.js 스크립트 로드 */
      if (!existing) {
        const script   = document.createElement("script")
        script.src     = "https://unpkg.com/wavesurfer.js"
        script.async   = true
        script.dataset.wavesurfer = "true"
        script.onload  = initWaveSurfer
        document.body.appendChild(script)
      } else {
        if ((window as any).WaveSurfer) initWaveSurfer()
        else existing.addEventListener("load", initWaveSurfer)
      }

      return () => {
        waveSurferRef.current?.destroy()
        waveSurferRef.current = null
      }
    }, [url])

    return <div ref={containerRef} className="w-full" />
  },
)
