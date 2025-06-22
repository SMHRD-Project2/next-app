"use client"

// Next.js 15‑ready client component (Edge/Bun compatible)
// ----------------------------------------------
import { useState, useEffect, useRef } from "react"

/**
 * Fish‑Speech ↔︎ Clova TTS demo
 *
 * 1. Engine 선택 (fish_speech | clova)
 * 2. POST to /tts   (fish_speech)
 *              /tts/clova (clova)
 * 3. 동일한 /tts/status 로 진행률 폴링
 * 4. 완료 시 WAV 재생
 */
export default function TTSClient() {
  // --------------------------------------------------
  // Local state
  // --------------------------------------------------
  const [text, setText] = useState("")
  const [engine, setEngine] = useState<"fish_speech" | "clova">("fish_speech")
  const [speaker, setSpeaker] = useState("vian") // clova only

  const [progress, setProgress] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // --------------------------------------------------
  // API ENDPOINT CONFIG
  // --------------------------------------------------
  const API_BASE = "https://voice.api.core.today"
  const API_KEY = "MdP61wZBvCyUeFq8TXr2L"
  // --------------------------------------------------

  /** Create TTS request */
  const generateTTS = async () => {
    if (!text.trim()) return alert("변환할 텍스트를 입력하세요.")

    setProgress(null)
    setStatusMessage("요청 중…")
    setAudioUrl(null)

    // Determine endpoint + body
    const isClova = engine === "clova"
    const endpoint = isClova ? `/tts/clova` : `/tts`

    const body: any = { text }
    if (isClova) {
      Object.assign(body, {
        speaker,
        volume: "0",
        speed: "0",
        pitch: "0",
        emotion: "0",
        emotion_strength: "1",
        sync: false
      })
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}?api_key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const { request_uid } = (await res.json()) as { request_uid: string }

      setStatusMessage("대기열에 추가됨 — 상태 확인 중…")
      pollingRef.current = setInterval(() => checkStatus(request_uid), 2000)
    } catch (err: any) {
      //console.error(err)
      setStatusMessage(`에러: ${err.message}`)
    }
  }

  /** Poll status */
  const checkStatus = async (uid: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/tts/status?request_uid=${uid}&api_key=${API_KEY}`,
        { cache: "no-store" }
      )
      if (!res.ok) throw new Error(`status ${res.status}`)
      type StatusRes = {
        status: "queued" | "processing" | "completed" | "failed"
        progress?: number | null
        message?: string | null
        download_url?: string | null
      }
      const data: StatusRes = await res.json()

      setProgress(data.progress ?? null)
      setStatusMessage(data.message ?? data.status)

      if (data.status === "completed" && data.download_url) {
        setAudioUrl(data.download_url)
        stopPolling()
      } else if (data.status === "failed") {
        stopPolling()
      }
    } catch (err: any) {
      //console.error(err)
      stopPolling()
      setStatusMessage(`상태 확인 오류: ${err.message}`)
    }
  }

  /** util */
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }
  useEffect(() => () => stopPolling(), [])

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Fish‑Speech / Clova TTS 데모</h1>

      {/* Engine selector */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-1">
          <input
            type="radio"
            name="engine"
            value="fish_speech"
            checked={engine === "fish_speech"}
            onChange={() => setEngine("fish_speech")}
          />
          <span>Fish‑Speech</span>
        </label>
        <label className="flex items-center space-x-1">
          <input
            type="radio"
            name="engine"
            value="clova"
            checked={engine === "clova"}
            onChange={() => setEngine("clova")}
          />
          <span>Clova</span>
        </label>

        {engine === "clova" && (
          <select
            className="border rounded p-1 text-sm"
            value={speaker}
            onChange={(e) => setSpeaker(e.target.value)}
          >
            <option value="vhyeri">vhyeri (여)</option>
            <option value="vian">vian (남)</option>
            <option value="vara">vara (여)</option>
            <option value="vnhyun">nhyun (남)</option>
          </select>
        )}
      </div>

      <textarea
        className="w-full border rounded p-2 h-32"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="여기에 변환할 텍스트를 입력하세요…"
      />

      <button
        onClick={generateTTS}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={!text.trim()}
      >
        음성 생성
      </button>

      {statusMessage && (
        <div className="space-y-1">
          <p>상태: {statusMessage}</p>
          {progress !== null && <p>진행률: {progress}%</p>}
        </div>
      )}

      {audioUrl && (
        <div className="mt-4 space-y-2">
          <audio controls src={audioUrl} className="w-full" />
          <p className="text-xs text-gray-500 break-all">{audioUrl}</p>
        </div>
      )}
    </div>
  )
}
