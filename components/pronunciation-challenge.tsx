"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, RefreshCw, Trophy, Star, ChevronDown, Play, Pause, Volume2, MessageSquare } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAIModels } from "@/lib/ai-model-context"
import { LoadingMessage } from "@/components/loading-message"
import { WaveformPlayer, WaveformPlayerHandle } from "@/components/waveform-player"
import { VoiceComparisonPanel } from "@/components/voice-comparison-panel"
import { getAuthStatus } from "@/lib/auth-utils"

interface Challenge {
  id: number;
  text: string;
  difficulty: string;
  description: string;
  tips: string;
  color: string;
  challengeAudioUrls: {
    [key: string]: {
      [key: string]: string;
    };
  };
  onAnalysisComplete?: (analysisResult: any, referenceUrl?: string, userRecordingUrl?: string) => void
}

interface PronunciationChallengeProps {
  isRecording: boolean
  onRecord: () => void
  hasRecorded: boolean
  onReset: () => void
  onAnalysisComplete?: (analysisResult: any, referenceUrl?: string, userRecordingUrl?: string) => void
}

const challenges = [
  {
    id: 1,
    text: "간장공장공장장",
    difficulty: "초급",
    description: "ㄱ과 ㅇ 발음의 정확한 구분",
    tips: "각 글자를 천천히 구분하여 발음하세요",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    challengeAudioUrls: {
      "간장공장공장장": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(1).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(1).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(1).wav"
      }
    }
  },
  {
    id: 2,
    text: "경찰청철창살",
    difficulty: "초급",
    description: "ㅊ과 ㅅ 발음의 명확한 차이",
    tips: "혀의 위치를 정확히 조절하여 발음하세요",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    challengeAudioUrls: {
      "경찰청철창살": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(2).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(2).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(2).wav"
      }
    }
  },
  {
    id: 3,
    text: "저기 계신 저 분이 박 법무부 장관이시다",
    difficulty: "중급",
    description: "받침과 연음의 정확한 처리",
    tips: "받침을 명확히 하고 자연스러운 연음을 만드세요",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    challengeAudioUrls: {
      "저기 계신 저 분이 박 법무부 장관이시다": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(3).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(3).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(3).wav"
      }
    }
  },
  {
    id: 4,
    text: "신라면 라면신라 신라라면 라면라신",
    difficulty: "중급",
    description: "ㄴ과 ㄹ 발음의 정확한 구분",
    tips: "혀끝의 움직임에 집중하여 발음하세요",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    challengeAudioUrls: {
      "신라면 라면신라 신라라면 라면라신": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(4).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(4).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(4).wav"
      }
    }
  },
  {
    id: 5,
    text: "앞집 팥죽은 붉은 팥 팥죽이고 뒷집 콩죽은 검은 콩 콩죽이다",
    difficulty: "고급",
    description: "복잡한 받침과 연음의 종합 처리",
    tips: "문장의 리듬감을 살려 자연스럽게 발음하세요",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    challengeAudioUrls: {
      "앞집 팥죽은 붉은 팥 팥죽이고 뒷집 콩죽은 검은 콩 콩죽이다": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(5).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(5).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(5).wav"
      }
    }
  },
  {
    id: 6,
    text: "내가 그린 기린 그림은 목이 긴 기린 그림이고 네가 그린 기린 그림은 목이 짧은 기린 그림이다",
    difficulty: "고급",
    description: "긴 문장에서의 발음 일관성 유지",
    tips: "호흡을 조절하며 끝까지 명확하게 발음하세요",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    challengeAudioUrls: {
      "내가 그린 기린 그림은 목이 긴 기린 그림이고 네가 그린 기린 그림은 목이 짧은 기린 그림이다": {
        "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(6).wav",
        "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(6).wav",
        "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(6).wav"
      }
    }
  },
]

export function PronunciationChallenge({ isRecording, onRecord, hasRecorded, onReset, onAnalysisComplete }: PronunciationChallengeProps) {
  const { models: aiModels, isLoading, defaultModelId } = useAIModels()
  const [selectedChallenge, setSelectedChallenge] = useState(challenges[0])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const currentChallengeRef = useRef<HTMLDivElement>(null)
  const [selectedModel, setSelectedModel] = useState<number | null>(null)
  const [playingModel, setPlayingModel] = useState<number | null>(null)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const waveformRef = useRef<WaveformPlayerHandle>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)  // 녹음된 오디오 재생용
  const exampleAudioRef = useRef<HTMLAudioElement | null>(null)  // AI 예시 음성 재생용
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedRecordingUrl, setUploadedRecordingUrl] = useState<string | null>(null)
  const [waveformHeights, setWaveformHeights] = useState<number[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    console.log('🔧 모델 초기화:', { isLoading, aiModelsLength: aiModels.length, defaultModelId });
    
    if (!isLoading && aiModels.length > 0) {
      const defaultModel = aiModels.find(model => model._id === defaultModelId) || aiModels[0]
      console.log('🎯 기본 모델 선택:', { defaultModel: defaultModel.name, id: defaultModel.id });
      setSelectedModel(defaultModel.id)
    }
  }, [aiModels, isLoading, defaultModelId])

  const handleChallengeSelect = (challenge: (typeof challenges)[0]) => {
    setSelectedChallenge(challenge)
    onReset()
    currentChallengeRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleDifficultySelect = (difficulty: string | null) => {
    setSelectedDifficulty(difficulty)
  }

  const filteredChallenges = selectedDifficulty
    ? challenges.filter((challenge) => challenge.difficulty === selectedDifficulty)
    : challenges

  const handleRandomChallenge = () => {
    const randomIndex = Math.floor(Math.random() * filteredChallenges.length)
    setSelectedChallenge(filteredChallenges[randomIndex])
    onReset()
  }

  const handlePlayExample = async () => {
    try {
      if (playingModel === selectedModel) {
        // 현재 재생 중인 모델의 음성을 일시정지
        if (exampleAudioRef.current) {
          exampleAudioRef.current.pause();
          setPlayingModel(null);
        }
        return;
      }

      // 이전에 재생 중이던 음성이 있다면 정지
      if (exampleAudioRef.current) {
        exampleAudioRef.current.pause();
        // URL이 blob URL인 경우에만 해제
        if (exampleAudioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(exampleAudioRef.current.src);
        }
      }

      // 새로운 Audio 객체 생성
      exampleAudioRef.current = new Audio();

      // 선택된 모델에 따라 적절한 URL 선택
      console.log('🔍 디버깅 정보:', {
        selectedModel,
        aiModels: aiModels.map(m => ({ id: m.id, name: m.name })),
        selectedChallenge: { id: selectedChallenge.id, text: selectedChallenge.text }
      });

      if (!selectedModel) {
        console.error('선택된 모델이 없습니다.');
        alert('AI 모델을 먼저 선택해주세요.');
        return;
      }

      const modelDetails = aiModels.find(model => model.id === selectedModel);
      if (!modelDetails) {
        console.error('선택된 모델을 찾을 수 없습니다:', selectedModel);
        alert('선택된 AI 모델을 찾을 수 없습니다.');
        return;
      }

      const modelName = modelDetails.name;
      console.log('선택된 모델 이름:', modelName);
      
      let audioUrl = '';

      // 챌린지 데이터에서 해당 모델의 음성 URL 찾기
      const challengeText = selectedChallenge.text;
      let shortModelName = modelName;
      
      // 모델 이름 매핑 (기존 아나운서들)
      if (modelName?.includes('김주하')) {
        shortModelName = '김주하';
      } else if (modelName?.includes('이동욱')) {
        shortModelName = '이동욱';
      } else if (modelName?.includes('박소현')) {
        shortModelName = '박소현';
      }
      
      // 챌린지 데이터에서 해당 모델의 음성 URL 찾기
      const challengeAudioUrl = (selectedChallenge.challengeAudioUrls as any)[challengeText]?.[shortModelName];
      
      if (challengeAudioUrl) {
        // 기존 아나운서 모델의 챌린지 음성이 있는 경우
        console.log('챌린지 음성 URL 발견:', challengeAudioUrl);
        audioUrl = `/api/audio-proxy?url=${encodeURIComponent(challengeAudioUrl)}`;
      } else {
        // 커스텀 모델이거나 챌린지 음성이 없는 경우 TTS 사용
        console.log('챌린지 음성이 없어 TTS 사용:', { modelName, challengeText });
        
        try {
          // 음성 파일 가져오기
          const modelUrl = modelDetails.url;
          const voiceResponse = await fetch(modelUrl || '');
          const voiceBlob = await voiceResponse.blob();

          // 무음 파일 가져오기
          const silenceResponse = await fetch('/audio/silence_100ms.wav');
          const silenceBlob = await silenceResponse.blob();

          // FormData 생성
          const formData = new FormData();
          formData.append('voice_file', voiceBlob, modelUrl?.split('/').pop() || '');
          formData.append('silence_file', silenceBlob, 'silence_100ms.wav');

          console.log('TTS 전송할 데이터:', {
            text: challengeText,
            voiceFileName: modelUrl?.split('/').pop(),
            formDataKeys: Array.from(formData.keys())
          });

          // Next.js API를 통해 TTS 요청
          const response = await fetch(`/api/tts?text=${encodeURIComponent(challengeText)}`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`TTS 변환 실패: ${errorText}`);
          }

          // TTS API는 JSON 응답으로 S3 URL을 반환
          const jsonResponse = await response.json();
          console.log("TTS JSON 응답:", jsonResponse);
          
          if (jsonResponse.success && jsonResponse.url) {
            // S3 URL을 직접 사용
            audioUrl = jsonResponse.url;
            console.log("TTS 결과 S3 URL:", audioUrl);
          } else {
            throw new Error("TTS 응답에 유효한 URL이 없습니다.");
          }
        } catch (ttsError) {
          console.error('TTS 생성 실패:', ttsError);
          alert(`${modelName} 모델로 음성을 생성할 수 없습니다: ${ttsError}`);
          return;
        }
      }

      console.log('최종 생성된 Audio URL:', audioUrl);

      exampleAudioRef.current.src = audioUrl;
      exampleAudioRef.current.onended = () => {
        setPlayingModel(null);
      };
      exampleAudioRef.current.onerror = (error) => {
        console.error('Example audio playback error:', error);
        setPlayingModel(null);
      };

      // 안전한 재생을 위해 try-catch 추가
      try {
        await exampleAudioRef.current.play();
        setPlayingModel(selectedModel);
      } catch (playError) {
        console.error('Failed to play example audio:', playError);
        setPlayingModel(null);
      }
    } catch (error) {
      console.error('Error playing example:', error);
      setPlayingModel(null);
    }
  };

  // 녹음 시작/중지 처리
  const handleRecord = async () => {
    if (!isRecording) {
      try {
        let audioStream: MediaStream;
        
        try {
          // 먼저 실제 마이크로 시도
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
          // console.log("마이크 접근 실패, 가상 오디오 스트림 생성 시도");
          // 마이크 접근 실패 시 가상 오디오 스트림 생성
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const destination = audioContext.createMediaStreamDestination();
          oscillator.connect(destination);
          oscillator.start();
          audioStream = destination.stream;
        }

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

        const mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined)
        
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType || 'audio/webm'
          })
          
          if (audioURL) {
            URL.revokeObjectURL(audioURL)
          }
          
          const url = URL.createObjectURL(audioBlob)
          setAudioURL(url)
          audioChunksRef.current = []

          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          setRecordingTime(0)

          // 녹음 완료 후 S3에 업로드 (자동 분석 비활성화)
          try {
            const uploadedUrl = await uploadToS3(audioBlob)
            setUploadedRecordingUrl(uploadedUrl)
          } catch (error) {
            console.error('업로드 중 오류 발생:', error)
          }
        }

        mediaRecorder.start()
        onRecord()
        
        setRecordingTime(0)
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } catch (err) {
        console.error('녹음 권한을 얻을 수 없습니다:', err)
        alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 확인해주세요.')
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      onRecord()
    }
  }

  // 녹음된 오디오 재생
  const handlePlay = async () => {
    if (!audioURL) return;
    
    try {
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      } else {
        if (audioRef.current) {
          audioRef.current.src = audioURL;
          await audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('재생 오류:', err);
      setIsPlaying(false);
    }
  };

  // 평가하기 버튼 클릭 핸들러 추가
  const handleEvaluate = async () => {
    if (!uploadedRecordingUrl) {
      console.error("업로드된 녹음 파일이 없습니다.");
      return;
    }
    
    await performVoiceAnalysis(uploadedRecordingUrl);
  }

  // S3 업로드 함수 추가
  const uploadToS3 = async (blob: Blob) => {
    console.log("전달된 blob:", blob)
    console.log("Blob 타입:", blob.type)
    console.log("Blob 크기:", blob.size)

    // blob 타입에 따라 파일명과 타입 결정
    let fileName: string
    let fileType: string
    
    if (blob.type === "audio/wav" || blob.type === "audio/wave") {
      fileName = "recording.wav"
      fileType = "audio/wav"
    } else if (blob.type === "audio/webm") {
      fileName = "recording.webm"
      fileType = "audio/webm"
    } else {
      // 기본값으로 webm 사용 (기존 호환성 유지)
      fileName = "recording.webm"
      fileType = "audio/webm"
      console.warn("알 수 없는 오디오 타입, 기본값(webm) 사용:", blob.type)
    }

    const formData = new FormData()
    const file = new File([blob], fileName, { type: fileType })

    console.log("생성된 File 객체:", file)
    console.log("File 타입:", file.type)
    console.log("File 크기:", file.size)
    console.log("파일명:", fileName)

    formData.append("file", file)

    for (let [key, value] of formData.entries()) {
      console.log("FormData 항목:", key, value)
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PY_URL}/upload_record`, {
        method: "POST",
        body: formData,
      })
      console.log("응답 상태:", res.status)

      if (!res.ok) {
        const errorText = await res.text()
        console.error("[ERROR] 서버 응답 오류:", errorText)
        throw new Error(`서버 응답 오류: ${res.status} ${errorText}`)
      }

      const data = await res.json()

      if (data.success) {
        console.log("업로드 성공:", data.url)
        return data.url
      } else {
        const errMsg = typeof data.error === "string" ? data.error : "업로드 중 알 수 없는 오류가 발생했습니다."
        console.error("업로드 실패:", data.error)
        throw new Error(errMsg)
      }
    } catch (error) {
      console.error("[ERROR] 업로드 중 예외 발생:", error)
      throw error
    }
  }

  // 녹음 파일 다운로드
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

  // 음성 분석 함수
  const performVoiceAnalysis = async (userRecordingUrl: string) => {
    try {
      setIsAnalyzing(true)
      
      // AI 아나운서 모델 정보 가져오기
      const modelDetails = aiModels.find(model => model.id === selectedModel)
      if (!modelDetails) {
        console.error("선택된 AI 모델을 찾을 수 없습니다.")
        setIsAnalyzing(false)
        return
      }

      // 챌린지에 맞는 레퍼런스 음성 URL 결정
      const modelName = modelDetails.name
      const challengeText = selectedChallenge.text
      
      // 모델 이름에서 "아나운서" 제거하여 매핑
      let shortModelName = modelName
      if (modelName?.includes('김주하')) {
        shortModelName = '김주하'
      } else if (modelName?.includes('이동욱')) {
        shortModelName = '이동욱'
      } else if (modelName?.includes('박소현')) {
        shortModelName = '박소현'
      }
      
      console.log("모델 이름 매핑:", { 
        originalName: modelName, 
        shortName: shortModelName,
        challengeText,
        availableKeys: Object.keys((selectedChallenge.challengeAudioUrls as any)[challengeText] || {})
      })
      
      // 먼저 챌린지 데이터에서 찾기
      let referenceUrl = (selectedChallenge.challengeAudioUrls as any)[challengeText]?.[shortModelName]

      if (!referenceUrl) {
        // 챌린지 음성이 없는 경우 TTS로 생성
        console.log("챌린지 음성이 없어 TTS로 레퍼런스 생성:", { modelName, challengeText });
        
        try {
          // 음성 파일 가져오기
          const modelUrl = modelDetails.url;
          const voiceResponse = await fetch(modelUrl || '');
          const voiceBlob = await voiceResponse.blob();

          // 무음 파일 가져오기
          const silenceResponse = await fetch('/audio/silence_100ms.wav');
          const silenceBlob = await silenceResponse.blob();

          // FormData 생성
          const formData = new FormData();
          formData.append('voice_file', voiceBlob, modelUrl?.split('/').pop() || '');
          formData.append('silence_file', silenceBlob, 'silence_100ms.wav');

          console.log('TTS 레퍼런스 전송할 데이터:', {
            text: challengeText,
            voiceFileName: modelUrl?.split('/').pop(),
            formDataKeys: Array.from(formData.keys())
          });

          // Next.js API를 통해 TTS 요청
          const response = await fetch(`/api/tts?text=${encodeURIComponent(challengeText)}`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`TTS 변환 실패: ${errorText}`);
          }

          // TTS API는 JSON 응답으로 S3 URL을 반환
          const jsonResponse = await response.json();
          console.log("TTS 레퍼런스 JSON 응답:", jsonResponse);
          
          if (jsonResponse.success && jsonResponse.url) {
            // S3 URL을 직접 사용
            referenceUrl = jsonResponse.url;
            console.log("TTS 레퍼런스 결과 S3 URL:", referenceUrl);
          } else {
            throw new Error("TTS 응답에 유효한 URL이 없습니다.");
          }
        } catch (ttsError) {
          console.error('TTS 레퍼런스 생성 실패:', ttsError);
          setIsAnalyzing(false);
          return;
        }
      }

      console.log("음성 분석 시작", {
        referenceUrl,
        userRecordingUrl,
        selectedModel: modelDetails.name,
        challengeText
      })

      // 음성 분석 API 호출
      const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_PY_URL}/analyze-voice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference_url: referenceUrl,
          user_url: userRecordingUrl
        })
      })

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text()
        throw new Error(`음성 분석 API 호출 실패: ${analysisResponse.status} - ${errorText}`)
      }

      const analysisResult = await analysisResponse.json()
      
      console.log("🎯 음성 분석 결과:", analysisResult)
      
      if (analysisResult.success && analysisResult.ai_feedback) {
        console.log("📊 상세 분석 점수:", analysisResult.analysis_result)
        console.log("🤖 AI 피드백:", analysisResult.ai_feedback)
        
        // 분석 결과를 부모 컴포넌트로 전달
        if (onAnalysisComplete) {
          onAnalysisComplete(analysisResult.ai_feedback, referenceUrl, userRecordingUrl)
        }
      } else {
        console.error("음성 분석 실패:", analysisResult.error)
      }

    } catch (error) {
      console.error("음성 분석 중 오류 발생:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  return (
    <div className="space-y-6">
      {/* 난이도 필터 버튼 */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedDifficulty === null ? "default" : "outline"}
          onClick={() => handleDifficultySelect(null)}
          className="flex-1"
        >
          전체
        </Button>
        <Button
          variant={selectedDifficulty === "초급" ? "default" : "outline"}
          onClick={() => handleDifficultySelect("초급")}
          className="flex-1"
        >
          초급
        </Button>
        <Button
          variant={selectedDifficulty === "중급" ? "default" : "outline"}
          onClick={() => handleDifficultySelect("중급")}
          className="flex-1"
        >
          중급
        </Button>
        <Button
          variant={selectedDifficulty === "고급" ? "default" : "outline"}
          onClick={() => handleDifficultySelect("고급")}
          className="flex-1"
        >
          고급
        </Button>
      </div>

      {/* 챌린지 선택 */}
      <Card className="bg-onair-bg-sub border-onair-text-sub/20">
        <CardHeader>
          <CardTitle className="text-onair-text flex items-center gap-2">
            <Trophy className="w-5 h-5 text-onair-orange" />
            발음 챌린지 선택
          </CardTitle>
          <p>어려운 발음에 도전하여 실력을 한 단계 업그레이드하세요</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedChallenge.id === challenge.id
                    ? "border-onair-mint bg-onair-mint/10"
                    : "border-onair-text-sub/20 bg-onair-bg hover:bg-onair-bg-sub"
                }`}
                onClick={() => handleChallengeSelect(challenge)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={challenge.color}>{challenge.difficulty}</Badge>
                    {selectedChallenge.id === challenge.id && <Star className="w-4 h-4 text-onair-mint fill-current" />}
                  </div>
                </div>
                <p className="text-onair-text font-medium mb-1">{challenge.text}</p>
                <p className="text-sm text-onair-text-sub mb-1">{challenge.description}</p>
                <p className="text-xs text-onair-text-sub italic">💡 {challenge.tips}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 선택된 챌린지 */}
      <Card ref={currentChallengeRef} className="bg-onair-bg-sub border-onair-text-sub/220">
        <CardHeader>
          <CardTitle className="text-onair-text flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>현재 챌린지</span>
              <Badge className={selectedChallenge.color}>{selectedChallenge.difficulty}</Badge>
            </div>
            <div className="inline-flex rounded-md shadow-sm border border-onair-mint">
              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center rounded-l-md rounded-r-none border-r border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg focus:z-10 focus:outline-none focus:ring-1 focus:ring-onair-mint"
                onClick={handlePlayExample}
              >
                {playingModel === selectedModel ? <Pause className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {selectedModel ? aiModels.find(model => model.id === selectedModel)?.name : 'AI 예시 듣기'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative inline-flex items-center rounded-r-md rounded-l-none text-onair-mint hover:bg-onair-mint hover:text-onair-bg px-2 focus:z-10 focus:outline-none focus:ring-1 focus:ring-onair-mint"
                    aria-label="AI 모델 선택"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  {aiModels.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        if (playingModel !== null) {
                          setPlayingModel(null);
                        }
                      }}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={model.avatar} />
                        <AvatarFallback className="bg-onair-bg text-onair-mint">
                          {model.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-onair-text-sub">{model.type}</span>
                      </div>
                      {selectedModel === model.id && (
                        <span className="ml-auto text-onair-mint">✓</span>
                      )}
                      {model.id && selectedModel == model.id && (
                        <Star className="w-4 h-4 text-onair-orange fill-current ml-auto" />
                      )}

                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-onair-bg rounded-lg border border-onair-text-sub/10">
            <p className="text-lg leading-relaxed text-onair-text text-center font-medium">{selectedChallenge.text}</p>
          </div>

          <div className="bg-onair-bg/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-onair-mint">🎯 포인트: {selectedChallenge.description}</p>
            <p className="text-sm text-onair-text-sub">💡 팁: {selectedChallenge.tips}</p>
          </div>

        
        {/* 녹음 컨트롤러 추가 */}
        <div className="mt-4">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-onair-text">
              {isRecording ? "녹음 중..." : hasRecorded ? "녹음 완료!" : " "}
            </h3>

            {isRecording && (
              <>
                <div className="flex items-center justify-center space-x-1 h-16">
                  {isClient && waveformHeights.length > 0 ? (
                    waveformHeights.map((height, i) => (
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
                    Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-onair-orange rounded-full animate-wave"
                        style={{
                          width: "4px",
                          height: "30px",
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
              {hasRecorded && !isRecording && audioURL && (
                // hidden 처리 (숨김 처리)
                <div className="w-full mb-4 hidden">
                  <WaveformPlayer 
                    ref={waveformRef} 
                    url={audioURL} 
                    onPlayStateChange={setIsPlaying}
                  />
                </div>
              )}
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
                    {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                    {isPlaying ? "일시정지" : "재생"}
                  </Button>
                  <Button
                    onClick={handleEvaluate}
                    size="lg"
                    variant="outline"
                    className="border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg"
                    disabled={isAnalyzing || !uploadedRecordingUrl}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        평가 중...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-5 h-5 mr-2" />
                        평가하기
                      </>
                    )}
                  </Button>
                  {/* <Button
                    onClick={handleDownload}
                    size="lg"
                    variant="outline"
                    className="border-onair-blue text-onair-blue hover:bg-onair-blue hover:text-onair-bg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    다운로드
                  </Button> */}
                </div>
              )}
            </div>

            {hasRecorded && !isRecording && isAnalyzing && <LoadingMessage />}
          </div>
        </div>

          {/* 숨겨진 audio 요소들 추가 */}
          {/* 녹음된 오디오 재생용 */}
          <audio 
            ref={audioRef}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('녹음된 오디오 재생 오류:', e);
              setIsPlaying(false);
            }}
            style={{ display: 'none' }}
          />
          {/* AI 예시 음성 재생용 */}
          <audio 
            ref={exampleAudioRef}
            onEnded={() => setPlayingModel(null)}
            onError={(e) => {
              console.error('AI 예시 오디오 재생 오류:', e);
              setPlayingModel(null);
            }}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>

    </div>
  )
}