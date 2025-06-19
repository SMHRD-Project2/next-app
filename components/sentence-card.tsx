"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Pencil, Volume2, ChevronDown, Play, Pause, Star, MessageSquare, Speech, Mic, Square, ArrowRight, Download, Lock, LogIn } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAIModels } from "@/lib/ai-model-context"
import { LoadingMessage } from "@/components/loading-message"
import { Progress } from "@/components/ui/progress"
import {
  WaveformPlayer,
  type WaveformPlayerHandle,
} from "@/components/waveform-player"
import { getAuthStatus } from "@/lib/auth-utils"

interface SentenceCardProps {
  sentence: string
  voiceUrl1?: string  // DB에서 가져온 voiceUrl 추가
  voiceUrl2?: string  // DB에서 가져온 voiceUrl 추가
  voiceUrl3?: string  // DB에서 가져온 voiceUrl 추가
  onSentenceChange?: (newSentence: string) => void  // 문장 수정 콜백
  onRefresh?: () => void
  currentTab: string             // 현재 탭 정보를 props로 받기
  isRecording: boolean
  onRecord: () => void
  hasRecorded: boolean
  onNext: () => void
  canNext: boolean
  waveformRef: React.RefObject<WaveformPlayerHandle>
  onRecordingComplete?: (url: string | null) => void
  onAnalysisComplete?: (analysisResult: any, referenceUrl?: string, userRecordingUrl?: string) => void  // 분석 결과 콜백 추가
}

export function SentenceCard({
  sentence,
  voiceUrl1,  // voiceUrl prop 추가
  voiceUrl2,  // voiceUrl prop 추가
  voiceUrl3,  // voiceUrl prop 추가
  onSentenceChange,
  onRefresh,
  currentTab,
  isRecording,
  onRecord,
  hasRecorded,
  onNext,
  canNext,
  waveformRef,
  onRecordingComplete,
  onAnalysisComplete
}: SentenceCardProps) {
  const { models: aiModels, isLoading, defaultModelId } = useAIModels()
  const [waveformHeights, setWaveformHeights] = useState<number[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)  // 분석 상태 추가
  const [isTTSLoading, setIsTTSLoading] = useState(false)  // TTS 로딩 상태 추가
  const [hasAnalyzed, setHasAnalyzed] = useState(false)  // 분석 완료 상태 추가

  // TTS 캐시 상태 추가
  const [ttsCache, setTtsCache] = useState<Map<string, string>>(new Map())

  // TTS progress state (for AI announcer playback)
  const [ttsProgress, setTtsProgress] = useState<number | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pendingAudioRef = useRef<HTMLAudioElement | null>(null)

  const maybePlayPendingAudio = () => {
    if (ttsProgress !== null && ttsProgress >= 100 && pendingAudioRef.current) {
      const audio = pendingAudioRef.current
      aiExampleAudioRef.current = audio
      audio.play()
      pendingAudioRef.current = null
    }
  }

  const MAX_LENGTH = 300;

  // 250609 박남규 - 내부 문장 상태를 따로 관리하도록 수정
  const [localSentence, setLocalSentence] = useState(sentence);
  
  // console.log("Initial sentence prop:", sentence);  // 초기 sentence prop 값 확인

  // textarea 참조를 위한 ref 추가
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // localSentence가 변경될 때마다 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localSentence]);

  // 250609 박남규 - 부모 props sentence 변경 시 내부 상태 동기화
  useEffect(() => {
    // console.log("Sentence prop changed to:", sentence);  // sentence prop 변경 시점 로그
    setLocalSentence(sentence);
    // 문장이 변경되면 기존 TTS 캐시 초기화
    setTtsCache(new Map());
    // console.log("localSentence updated to:", sentence);  // localSentence 업데이트 후 값 확인
  }, [sentence]);

  useEffect(() => {
    // 클라이언트 마운트 확인
    setIsClient(true)
    // 클라이언트 사이드에서만 랜덤 값 생성
    const heights = Array.from({ length: 40 }, () => Math.random() * 30 + 10)
    setWaveformHeights(heights)

    // 클라이언트에서만 로그인 상태 확인
    if (typeof window !== "undefined") {
      const { isLoggedIn: loggedIn } = getAuthStatus()
      setIsLoggedIn(loggedIn)
    }

    // 로그인 상태 변경 감지
    const handleAuthChange = () => {
      if (typeof window !== "undefined") {
        const { isLoggedIn: loggedIn } = getAuthStatus()
        setIsLoggedIn(loggedIn)
      }
    }

    window.addEventListener('localStorageChange', handleAuthChange)
    return () => window.removeEventListener('localStorageChange', handleAuthChange)
  }, [])

  // // Cleanup SSE when unmounting
  // useEffect(() => {
  //   return () => {
  //     if (eventSourceRef.current) {
  //       eventSourceRef.current.close()
  //     }
  //   }
  // }, [])

  // 250609 박남규 - textarea onChange 핸들러에서 내부 상태 및 부모 콜백 호출
  const handleSentenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputText = e.target.value;
    // console.log("Textarea input:", inputText);  // 입력된 텍스트 확인
    const truncatedText = inputText.slice(0, MAX_LENGTH);
    setLocalSentence(truncatedText);
    // 문장이 변경되면 기존 TTS 캐시 초기화
    setTtsCache(new Map());
    // console.log("localSentence set to:", truncatedText);  // localSentence 설정 값 확인
    
    if (onSentenceChange) onSentenceChange(truncatedText);
  }

  // selectedModel 상태 초기화 로직 개선 및 aiModels 변경 시 업데이트
  const [selectedModel, setSelectedModel] = useState<number | null>(() => {
    // 초기값을 localStorage에서 가져옴
    if (typeof window !== 'undefined') {
      const savedDefaultId = localStorage.getItem('defaultModelId');
      return savedDefaultId ? parseInt(savedDefaultId) : null;
    }
    return null;
  });
  
  useEffect(() => {
    if (isLoading) return;
    
    // Find the default model and set it as selected
    const defaultModel = aiModels.find(model => model._id === defaultModelId);
    if (defaultModel) {
      setSelectedModel(defaultModel.id);
    }
    
    // Listen for model changes
    const handleModelChange = () => {
      const defaultModel = aiModels.find(model => model._id === defaultModelId);
      if (defaultModel) {
        setSelectedModel(defaultModel.id);
      }
    };
    
    window.addEventListener('aiModelChange', handleModelChange);
    return () => window.removeEventListener('aiModelChange', handleModelChange);
  }, [aiModels, isLoading, defaultModelId]);

  const [playingModel, setPlayingModel] = useState<number | null>(null)
  const selectedModelAudioRef = useRef<HTMLAudioElement | null>(null);
  const aiExampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlayingSelectedModel, setIsPlayingSelectedModel] = useState(false);
  const [isPlayingAIExample, setIsPlayingAIExample] = useState(false);

  // const handlePlaySelectedModelSentence = async () => {
  //   // 현재 재생 중인 AI 예시 음성 중지 (만약 있다면)
  //   if (aiExampleAudioRef.current) {
  //     aiExampleAudioRef.current.pause();
  //     URL.revokeObjectURL(aiExampleAudioRef.current.src);
  //     aiExampleAudioRef.current = null;
  //     setIsPlayingAIExample(false);
  //   }

  //   // 이미 선택된 모델의 음성이 재생 중이면 중지하고 초기화
  //   if (isPlayingSelectedModel) {
  //     if (selectedModelAudioRef.current) {
  //       selectedModelAudioRef.current.pause();
  //       URL.revokeObjectURL(selectedModelAudioRef.current.src);
  //       selectedModelAudioRef.current = null;
  //     }
  //     setIsPlayingSelectedModel(false);
  //     return;
  //   }

  //   // 선택된 모델이 없으면 경고 후 종료 (실제 모델 선택이 필요한 경우)
  //   if (!selectedModel) {
  //     console.warn("선택된 모델이 없어 음성을 재생할 수 없습니다.");
  //     return;
  //   }

  //   try {
  //     setIsPlayingSelectedModel(true);

  //     // AI 모델 DB에서 URL 가져오기
  //     const modelUrl = aiModels.find(model => model.id === selectedModel)?.url;
  //     if (!modelUrl) {
  //       throw new Error("모델 URL을 찾을 수 없습니다.");
  //     }

  //     // 음성 파일 가져오기
  //     const voiceResponse = await fetch(modelUrl);
  //     const voiceBlob = await voiceResponse.blob();
  //     const audioUrl = URL.createObjectURL(voiceBlob);
      
  //     const audio = new Audio(audioUrl);
  //     selectedModelAudioRef.current = audio;

  //     audio.onended = () => {
  //       setIsPlayingSelectedModel(false);
  //       URL.revokeObjectURL(audioUrl);
  //       if (selectedModelAudioRef.current === audio) {
  //         selectedModelAudioRef.current = null;
  //       }
  //     };

  //     audio.play();

  //   } catch (error) {
  //     console.error('음성 재생 중 오류:', error);
  //     setIsPlayingSelectedModel(false);
  //     selectedModelAudioRef.current = null;
  //   }
  // };

  const handlePlayAIExample = async () => {
    if (!selectedModel) {
      console.error("선택된 모델이 없습니다.");
      return;
    }

    // 이미 TTS 로딩 중이면 취소
    if (isTTSLoading) {
      console.log("TTS가 이미 진행 중입니다.");
      return;
    }

    // 현재 재생 중인 오디오가 있다면 중지
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsPlayingAIExample(false);
      return;
    }

    try {
      // 캐시 키 생성 (문장 + 모델 ID + 탭)
      const cacheKey = `${localSentence}_${selectedModel}_${currentTab}`;
      
      // 캐시된 TTS 결과가 있는지 확인
      let audioUrl: string | null = ttsCache.get(cacheKey) || null;
      
      if (audioUrl) {
        console.log("캐시된 TTS 결과 사용:", cacheKey);
        
        // 캐시된 URL로 바로 재생
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        
        audio.onended = () => {
          setIsPlayingAIExample(false);
          currentAudioRef.current = null;
        };

        audio.onerror = () => {
          setIsPlayingAIExample(false);
          currentAudioRef.current = null;
        };

        await audio.play();
        setIsPlayingAIExample(true);
        return;
      }

      setIsTTSLoading(true);  // TTS 로딩 시작
      console.log("새로운 TTS 생성 시작:", cacheKey);
      
      // DB의 voiceUrl이 있으면 사용, 없으면 TTS 생성
      audioUrl = null;
      
      if (currentTab !== 'custom') {
        const modelDetails = aiModels.find(model => model.id === selectedModel);
        if (modelDetails?.name === '김주하 아나운서' && voiceUrl1) {
          audioUrl = voiceUrl1;
        } else if (modelDetails?.name === '이동욱 아나운서' && voiceUrl2) {
          audioUrl = voiceUrl2;
        } else if (modelDetails?.name === '박소현 아나운서' && voiceUrl3) {
          audioUrl = voiceUrl3;
        }
      }

      // DB에 음성이 없거나 custom 탭인 경우 TTS 사용
      if (!audioUrl) {
        console.log("Using TTS for playback");
        const modelUrl = aiModels.find(model => model.id === selectedModel)?.url;
        console.log("Selected Model URL:", modelUrl);
        console.log("Selected localSentence:", localSentence);

        // 음성 파일 가져오기
        const voiceResponse = await fetch(modelUrl || '');
        const voiceBlob = await voiceResponse.blob();

        // 무음 파일 가져오기
        const silenceResponse = await fetch('/audio/silence_100ms.wav');
        const silenceBlob = await silenceResponse.blob();

        // FormData 생성
        const formData = new FormData();
        formData.append('voice_file', voiceBlob, modelUrl?.split('/').pop() || '');
        formData.append('silence_file', silenceBlob, 'silence_100ms.wav');

        console.log('전송할 데이터:', {
          text: localSentence,
          voiceFileName: modelUrl?.split('/').pop(),
          formDataKeys: Array.from(formData.keys())
        });

        // Next.js API를 통해 요청
        const response = await fetch(`/api/tts?text=${encodeURIComponent(localSentence)}`, {
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
      }

      // TTS 결과를 캐시에 저장
      if (audioUrl) {
        setTtsCache(prev => {
          const newCache = new Map(prev);
          newCache.set(cacheKey, audioUrl!);
          console.log("TTS 결과 캐시 저장:", cacheKey);
          return newCache;
        });
      }

      // 새로운 오디오 생성 및 재생
      const audio = new Audio(audioUrl!);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingAIExample(false);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlayingAIExample(false);
        currentAudioRef.current = null;
      };

      await audio.play();
      setIsPlayingAIExample(true);
    } catch (error) {
      console.error('TTS 처리 중 오류:', error);
      setIsPlayingAIExample(false);
      currentAudioRef.current = null;
    } finally {
      setIsTTSLoading(false);  // TTS 로딩 완료
    }
  };

  // const handleTTSPlayback = async (modelDetails: typeof aiModels[0]) => {
  //   try {
  //     console.log("Starting TTS conversion for model:", modelDetails.name);
  //     console.log("Text to convert:", localSentence);
      
  //     const response = await fetch("/api/tts", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         text: localSentence,
  //         modelId: modelDetails.id,
  //       }),
  //     });

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       console.error("TTS API Error Response:", errorText);
  //       throw new Error(`TTS conversion failed: ${errorText}`);
  //     }

  //     const data = await response.json();
  //     console.log("TTS API Response:", data);
      
  //     if (!data.audioUrl) {
  //       throw new Error("No audio URL in TTS response");
  //     }

  //     // 현재 재생 중인 오디오가 있다면 중지
  //     if (currentAudioRef.current) {
  //       currentAudioRef.current.pause();
  //       currentAudioRef.current = null;
  //     }

  //     // 새로운 오디오 생성 및 재생
  //     const audio = new Audio(data.audioUrl);
  //     currentAudioRef.current = audio;
      
  //     audio.onended = () => {
  //       setIsPlaying(false);
  //       currentAudioRef.current = null;
  //     };

  //     await audio.play();
  //     setIsPlaying(true);
  //   } catch (error) {
  //     console.error("TTS Error:", error);
  //     setIsPlaying(false);
  //     currentAudioRef.current = null;
      
  //     // 에러 발생 시 사용자에게 알림
  //     alert("음성 변환에 실패했습니다. 다시 시도해주세요.");
  //   }
  // };

  // 녹음 관련 상태들 추가
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [waveHeights, setWaveHeights] = useState<number[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])  
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [uploadedRecordingUrl, setUploadedRecordingUrl] = useState<string | null>(null)  // 업로드된 녹음 URL 저장

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);  // 녹음된 오디오 재생용 ref 추가

  // 평가하기 버튼 클릭 핸들러 추가
  const handleEvaluate = async () => {
    if (!uploadedRecordingUrl) {
      console.error("업로드된 녹음 파일이 없습니다.");
      return;
    }
    
    await performVoiceAnalysis(uploadedRecordingUrl);
  }

  //  2506011 박남규 aws 업로드하기
  const uploadToS3 = async (blob: Blob, skipAnalysis: boolean = false) => {
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
        setUploadedRecordingUrl(data.url)  // 업로드된 URL 저장
        if (onRecordingComplete) onRecordingComplete(data.url)
        
        // skipAnalysis가 false일 때만 음성 분석 시작 (무한 루프 방지)
        if (!skipAnalysis) {
          await performVoiceAnalysis(data.url)
        }
        
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

  // 음성 분석 함수 추가
  const performVoiceAnalysis = async (userRecordingUrl: string) => {
    try {
      setIsAnalyzing(true);  // 분석 시작
      
      // AI 아나운서 모델 정보 가져오기
      const modelDetails = aiModels.find(model => model.id === selectedModel);
      if (!modelDetails) {
        console.error("선택된 AI 모델을 찾을 수 없습니다.");
        setIsAnalyzing(false);  // 분석 실패 시 상태 초기화
        return;
      }

      // 레퍼런스 음성 URL 결정
      let referenceUrl = null;
      
      // 아나운서 모델이고 voiceUrl이 있으며, custom 탭이 아닌 경우에만 DB의 voiceUrl 사용
      if (currentTab !== 'custom') {
        if (modelDetails.name === '김주하 아나운서' && voiceUrl1) {
          referenceUrl = voiceUrl1;
        } else if (modelDetails.name === '이동욱 아나운서' && voiceUrl2) {
          referenceUrl = voiceUrl2;
        } else if (modelDetails.name === '박소현 아나운서' && voiceUrl3) {
          referenceUrl = voiceUrl3;
        }
      }

      // DB에 음성이 없거나 custom 탭인 경우 모델 URL 사용
      if (!referenceUrl) {
        console.log("DB에 음성이 없거나 custom 탭인 경우 모델 URL 사용");
        const modelUrl = aiModels.find(model => model.id === selectedModel)?.url;
        console.log("Selected Model URL:", modelUrl);
        console.log("Selected localSentence:", localSentence);

        // 음성 파일 가져오기
        const voiceResponse = await fetch(modelUrl || '');
        const voiceBlob = await voiceResponse.blob();

        // 무음 파일 가져오기
        const silenceResponse = await fetch('/audio/silence_100ms.wav');
        const silenceBlob = await silenceResponse.blob();

        // FormData 생성
        const formData = new FormData();
        formData.append('voice_file', voiceBlob, modelUrl?.split('/').pop() || '');
        formData.append('silence_file', silenceBlob, 'silence_100ms.wav');

        console.log('전송할 데이터:', {
          text: localSentence,
          voiceFileName: modelUrl?.split('/').pop(),
          formDataKeys: Array.from(formData.keys())
        });

        // Next.js API를 통해 요청
        const response = await fetch(`/api/tts?text=${encodeURIComponent(localSentence)}`, {
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
          referenceUrl = jsonResponse.url;
          console.log("TTS 결과 S3 URL:", referenceUrl);
        } else {
          throw new Error("TTS 응답에 유효한 URL이 없습니다.");
        }
      }

      if (!referenceUrl) {
        console.error("레퍼런스 음성 URL을 찾을 수 없습니다.");
        return;
      }

      console.log("음성 분석 시작", {
        referenceUrl,
        userRecordingUrl,
        selectedModel: modelDetails.name,
        currentTab
      });

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
      });

      console.log("음성 분석 API 응답 상태:", analysisResponse.status);
      console.log("음성 분석 API 응답 헤더:", Object.fromEntries(analysisResponse.headers.entries()));

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("음성 분석 API 오류 응답:", errorText);
        throw new Error(`음성 분석 API 호출 실패: ${analysisResponse.status} - ${errorText}`);
      }

      const analysisResult = await analysisResponse.json();
      
      console.log("🎯 음성 분석 결과:", analysisResult);
      
      if (analysisResult.success) {
        console.log("📊 상세 분석 점수:");
        console.log("- 발음특성(MFCC) 점수:", analysisResult.analysis_result.mfcc);
        console.log("- 음정(Pitch) 점수:", analysisResult.analysis_result.pitch);
        console.log("- 음량(Energy) 점수:", analysisResult.analysis_result.energy);
        console.log("- 발음속도(Speech-rate) 점수:", analysisResult.analysis_result.speed);
        console.log("- 음색(Formant) 점수:", analysisResult.analysis_result.formant);
        console.log("- 음정(Intonation) 점수:", analysisResult.analysis_result.intonation);
        console.log("- 리듬(Rhythm) 점수:", analysisResult.analysis_result.rhythm);
        console.log("- 문장간 쉼(Pause) 점수:", analysisResult.analysis_result.pause);
        console.log("🏆 종합 점수:", analysisResult.analysis_result.total);
        
        // OpenAI 피드백 결과 출력
        if (analysisResult.ai_feedback) {
          console.log("\n🤖 OpenAI 피드백 결과:");
          console.log("- 분석 ID:", analysisResult.ai_feedback.analysisId);
          console.log("- 전체 점수:", analysisResult.ai_feedback.overallScore);
          console.log("- 항목별 피드백:");
          
          analysisResult.ai_feedback.items.forEach((item: any) => {
            console.log(`   ${item.metric} (${item.score}점):`);
            console.log(`     짧은 피드백: ${item.shortFeedback}`);
            console.log(`     상세 피드백:`, item.detailedFeedback);
          });
          
          // 전체 피드백 객체도 출력 (개발자용)
          console.log("🔍 전체 AI 피드백 객체:", analysisResult.ai_feedback);
          
          // 분석 완료 상태를 true로 설정
          setHasAnalyzed(true);
          
          // 분석 결과를 부모 컴포넌트로 전달
          if (onAnalysisComplete) {
            onAnalysisComplete(analysisResult.ai_feedback, referenceUrl, userRecordingUrl);
          }
        } else {
          console.log("⚠️ OpenAI 피드백을 받지 못했습니다.");
        }
      } else {
        console.error("음성 분석 실패:", analysisResult.error);
        console.error("전체 분석 결과:", analysisResult);
      }

    } catch (error) {
      console.error("음성 분석 중 오류 발생:", error);
      console.error("에러 상세 정보:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
    } finally {
      setIsAnalyzing(false);  // 분석 완료 (성공/실패 관계없이)
    }
  }


  // 녹음 관련 함수들 추가
  const handleRecord = async () => {
    // console.log("handleRecord called. isRecording:", isRecording);
    if (!isRecording) {
      try {
        // console.log("Attempting to get media stream...");
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


        let mimeType = 'audio/webm;codecs=opus'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm'
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4'
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = ''
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

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType || 'audio/webm'
          })

          if (audioURL) {
            URL.revokeObjectURL(audioURL)
          }

          const url = URL.createObjectURL(audioBlob)
          setAudioURL(url)
          if (onRecordingComplete) onRecordingComplete(url)
          audioChunksRef.current = []

          // 새로운 녹음 시 분석 완료 상태 초기화
          setHasAnalyzed(false)

          // 250611 박남규 업로드 - skipAnalysis: true로 자동 분석 비활성화
          uploadToS3(audioBlob, true)
          audioChunksRef.current = []


          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          setRecordingTime(0)

        }
        if (onRecordingComplete) onRecordingComplete(null)
        mediaRecorder.start()
        onRecord()

        setRecordingTime(0)
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } catch (err) {
        console.error('녹음 권한을 얻을 수 없습니다:', err)
        alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 확인해주세요.')
        // 여기에서 err 객체를 자세히 로깅하여 어떤 종류의 오류인지 확인
        console.error("Error details:", err)
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      onRecord()
    }
  }

  // const handlePlay = async () => {
  //   if (audioRef.current && audioURL) {
  //     try {
  //       if (isPlaying) {
  //         audioRef.current.pause()
  //         setIsPlaying(false)
  //       } else {
  //         audioRef.current.src = audioURL
  //         await audioRef.current.play()
  //         setIsPlaying(true)
  //       }
  //     } catch (err) {
  //       console.error('재생 오류:', err)
  //       setIsPlaying(false)
  //     }
  //   }
  // }
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

  const handleDownload = () => {
    if (audioURL) {
      const link = document.createElement('a')
      link.href = audioURL
      link.download = 'recorded-audio.wav'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleLoginRedirect = () => {
    window.location.href = "/auth/login"
  }

  // const handleWordClick = (index: number) => {
  //   const totalDuration = waveformRef.current?.getDuration()
  //   if (!totalDuration || words.length === 0) return

  //   const timePerWord = totalDuration / words.length
  //   waveformRef.current?.setCurrentTime(timePerWord * index)
  //   waveformRef.current?.play()

  //   setIsPlaying(true)
  //   setHighlightIndex(index)
  // }

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20">
      <CardHeader>
        <CardTitle className="text-onair-text flex items-center justify-between">
          <span>훈련 문장</span>
          <div className="flex items-center space-x-2 ml-auto">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                className="border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg"
                onClick={onRefresh}
                aria-label="문장 새로고침"
                title="다른 문장으로 교체"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}

            <div className="inline-flex rounded-md shadow-sm border border-onair-mint relative">
              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center rounded-l-md rounded-r-none border-r border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg focus:z-10 focus:outline-none focus:ring-1 focus:ring-onair-mint"
                onClick={handlePlayAIExample}
                disabled={isTTSLoading}
              >
                {isTTSLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    음성 생성 중...
                  </>
                ) : isPlayingAIExample ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    재생 중지
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    {selectedModel ? aiModels.find(model => model.id === selectedModel)?.name : 'AI 예시 듣기'}
                  </>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative inline-flex items-center rounded-r-md rounded-l-none text-onair-mint hover:bg-onair-mint hover:text-onair-bg px-2 focus:z-10 focus:outline-none focus:ring-1 focus:ring-onair-mint"
                    aria-label="AI 모델 선택"
                    disabled={isTTSLoading}
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
                        // Stop AI Example playback if it's playing when a new model is selected
                        if (aiExampleAudioRef.current) {
                          aiExampleAudioRef.current.pause();
                          URL.revokeObjectURL(aiExampleAudioRef.current.src);
                          aiExampleAudioRef.current = null;
                          setIsPlayingAIExample(false);
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

              {/* 비회원 블러 처리 오버레이 - AI 예시 듣기 버튼만 */}
              {!isLoggedIn && (
                <div className="absolute inset-0 bg-onair-bg/80 backdrop-blur-sm rounded-md flex items-center justify-center">
                    <Lock className="w-4 h-4 text-onair-mint mx-auto mb-1" />
                  {/* <div className="text-center p-2 bg-onair-bg-sub rounded border border-onair-text-sub/20">
                    <p className="text-xs text-onair-text-sub">로그인 필요</p>
                  </div> */}
                </div>
              )}
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* 250609 박남규 - 훈련 문장을 직접 보여주고 수정 가능하도록 처리 */}
        <div className="p-6 bg-onair-bg rounded-lg border border-onair-text-sub/10">
          <textarea
            ref={textareaRef}
            className="w-full min-h-[8rem] resize-none bg-onair-bg text-onair-text text-lg leading-relaxed text-center rounded-md border border-onair-text-sub/20 p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            value={localSentence}
            onChange={handleSentenceChange}
            spellCheck={false}
            readOnly={currentTab !== 'custom' || isPlayingAIExample || isTTSLoading}
            maxLength={MAX_LENGTH}
          />
          <p className="text-sm text-onair-text-sub text-right">
            {localSentence.length}/300
          </p>
          {currentTab === 'custom' && ttsProgress !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-onair-text-sub">AI 진행률</span>
                <span className="text-onair-mint">{Math.round(ttsProgress)}%</span>
              </div>
              <Progress value={ttsProgress} className="h-2" />
            </div>
          )}
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
                    disabled={isAnalyzing || !uploadedRecordingUrl || hasAnalyzed}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        평가 중...
                      </>
                    ) : hasAnalyzed ? (
                      <>
                        <MessageSquare className="w-5 h-5 mr-2" />
                        평가 완료
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

        {/* 숨겨진 audio 요소 추가 */}
        <audio 
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('오디오 재생 오류:', e);
            setIsPlaying(false);
          }}
          style={{ display: 'none' }}
        />
      </CardContent>
    </Card>
  )
}