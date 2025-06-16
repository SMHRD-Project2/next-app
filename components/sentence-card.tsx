"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Pencil, Volume2, ChevronDown, Play, Pause, Star, MessageSquare, Speech, Mic, Square, ArrowRight, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { aiModels } from "./ai-model-manager"
import { LoadingMessage } from "@/components/loading-message"

interface SentenceCardProps {
  sentence: string
  onSentenceChange?: (newSentence: string) => void  // 문장 수정 콜백
  onRefresh?: () => void
  currentTab: string             // 현재 탭 정보를 props로 받기
  isRecording: boolean
  onRecord: () => void
  hasRecorded: boolean
  onNext: () => void
  canNext: boolean
}

export function SentenceCard({ 
  sentence, 
  onSentenceChange, 
  onRefresh, 
  currentTab,
  isRecording,
  onRecord,
  hasRecorded,
  onNext,
  canNext 
}: SentenceCardProps) {
  const [waveformHeights, setWaveformHeights] = useState<number[]>([])
  const [isClient, setIsClient] = useState(false)


  const MAX_LENGTH = 500;

  // 250609 박남규 - 내부 문장 상태를 따로 관리하도록 수정
  const [localSentence, setLocalSentence] = useState(sentence);

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
    setLocalSentence(sentence);
  }, [sentence]);

  useEffect(() => {
    // 클라이언트 마운트 확인
    setIsClient(true)
    // 클라이언트 사이드에서만 랜덤 값 생성
    const heights = Array.from({ length: 40 }, () => Math.random() * 30 + 10)
    setWaveformHeights(heights)
  }, [])

  // 250609 박남규 - textarea onChange 핸들러에서 내부 상태 및 부모 콜백 호출
  const handleSentenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputText = e.target.value;
    const truncatedText = inputText.slice(0, MAX_LENGTH);
    setLocalSentence(truncatedText);
    if (onSentenceChange) onSentenceChange(truncatedText);
  }

  // selectedModel 상태 초기화 로직 개선 및 aiModels 변경 시 업데이트
  const [selectedModel, setSelectedModel] = useState<number | null>(null) // 초기값은 null로 설정

  useEffect(() => {
    // aiModels가 로드되었고, 아직 모델이 선택되지 않았다면 첫 번째 모델을 선택
    if (aiModels.length > 0 && selectedModel === null) {
      setSelectedModel(aiModels[0].id);
    }
  }, [aiModels, selectedModel]); // aiModels 또는 selectedModel이 변경될 때마다 실행

  const [playingModel, setPlayingModel] = useState<number | null>(null)
  const selectedModelAudioRef = useRef<HTMLAudioElement | null>(null);
  const aiExampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlayingSelectedModel, setIsPlayingSelectedModel] = useState(false);
  const [isPlayingAIExample, setIsPlayingAIExample] = useState(false);

  const handlePlaySelectedModelSentence = async () => {
    // 현재 재생 중인 AI 예시 음성 중지 (만약 있다면)
    if (aiExampleAudioRef.current) {
      aiExampleAudioRef.current.pause();
      URL.revokeObjectURL(aiExampleAudioRef.current.src);
      aiExampleAudioRef.current = null;
      setIsPlayingAIExample(false);
    }

    // 이미 선택된 모델의 음성이 재생 중이면 중지하고 초기화
    if (isPlayingSelectedModel) {
      if (selectedModelAudioRef.current) {
        selectedModelAudioRef.current.pause();
        URL.revokeObjectURL(selectedModelAudioRef.current.src);
        selectedModelAudioRef.current = null;
      }
      setIsPlayingSelectedModel(false);
      return;
    }

    // 선택된 모델이 없으면 경고 후 종료 (실제 모델 선택이 필요한 경우)
    if (!selectedModel) {
      console.warn("선택된 모델이 없어 음성을 재생할 수 없습니다.");
      return;
    }

    try {
      setIsPlayingSelectedModel(true);

      // --- 여기에 수정된 부분 시작 ---
      // 사용자 요청에 따라 audio/female.wav 파일을 직접 재생
      const audioUrl = "/audio/female.wav"; // 재생할 오디오 파일 경로 고정
      const audio = new Audio(audioUrl);
      selectedModelAudioRef.current = audio; // 오디오 객체 저장
      
      audio.onended = () => {
        setIsPlayingSelectedModel(false);
        // 로컬 파일이므로 URL.revokeObjectURL 필요 없음
        if (selectedModelAudioRef.current === audio) {
          selectedModelAudioRef.current = null;
        }
      };
      
      audio.play();
      // --- 수정된 부분 끝 ---

    } catch (error) {
      console.error('음성 재생 중 오류:', error);
      setIsPlayingSelectedModel(false);
      selectedModelAudioRef.current = null;
    }
  };

  const handlePlayAIExample = async () => {
    // Stop Selected Model Sentence playback if it's playing
    if (selectedModelAudioRef.current) {
      selectedModelAudioRef.current.pause();
      URL.revokeObjectURL(selectedModelAudioRef.current.src);
      selectedModelAudioRef.current = null;
      setIsPlayingSelectedModel(false);
    }

    // If already playing, stop and reset
    if (isPlayingAIExample) {
      if (aiExampleAudioRef.current) {
        aiExampleAudioRef.current.pause();
        URL.revokeObjectURL(aiExampleAudioRef.current.src);
        aiExampleAudioRef.current = null;
      }
      setIsPlayingAIExample(false);
      return; // Stop if already playing and toggle off
    }

    try {
      setIsPlayingAIExample(true);
      // ##########################################################################
      const modelUrl = aiModels.find(model => model.id === selectedModel)?.url;
      console.log("Selected Model URL:", modelUrl)
      console.log("Selected localSentence:", localSentence)
      
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
        console.error('서버 응답:', errorText);
        throw new Error(`TTS 변환 실패: ${errorText}`);
      }

      // 오디오 데이터를 Blob으로 변환
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      aiExampleAudioRef.current = audio; // 오디오 객체 저장

      audio.onended = () => {
        setIsPlayingAIExample(false);
        // 로컬 파일이므로 URL.revokeObjectURL 필요 없음
        if (aiExampleAudioRef.current === audio) {
          aiExampleAudioRef.current = null;
        }
      };
      
      audio.play();

    } catch (error) {
      console.error('AI 예시 음성 재생 중 오류:', error);
      setIsPlayingAIExample(false);
      aiExampleAudioRef.current = null;
    }
  };

  // 녹음 관련 상태들 추가
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [waveHeights, setWaveHeights] = useState<number[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 녹음 관련 함수들 추가
  const handleRecord = async () => {
    console.log("handleRecord called. isRecording:", isRecording);
    if (!isRecording) {
      try {
        console.log("Attempting to get media stream...");
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log("Media stream obtained successfully.");
        
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
          audioChunksRef.current = []

          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          setRecordingTime(0)
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

            <div className="inline-flex rounded-md shadow-sm border border-onair-mint">
              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center rounded-l-md rounded-r-none border-r border-onair-mint text-onair-mint hover:bg-onair-mint hover:text-onair-bg focus:z-10 focus:outline-none focus:ring-1 focus:ring-onair-mint"
                onClick={handlePlayAIExample}
              >
                {isPlayingAIExample}
                {isPlayingAIExample ? <Pause className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
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
                        // Stop AI Example playback if it's playing when a new model is selected
                        if (aiExampleAudioRef.current) {
                          aiExampleAudioRef.current.pause();
                          URL.revokeObjectURL(aiExampleAudioRef.current.src);
                          aiExampleAudioRef.current = null;
                          setIsPlayingAIExample(false);
                        }
                        // Stop Selected Model Sentence playback if it's playing when a new model is selected
                        if (selectedModelAudioRef.current) {
                          selectedModelAudioRef.current.pause();
                          URL.revokeObjectURL(selectedModelAudioRef.current.src);
                          selectedModelAudioRef.current = null;
                          setIsPlayingSelectedModel(false);
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
                      {model.isDefault && selectedModel !== model.id && (
                        <Star className="w-4 h-4 text-onair-orange fill-current ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
            readOnly={currentTab !== 'custom' || isPlayingAIExample}
            maxLength={MAX_LENGTH}
          />
          <p className="text-sm text-onair-text-sub text-right">
            {localSentence.length}/500
          </p>
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
        </div>
      </CardContent>
    </Card>
  )
}

