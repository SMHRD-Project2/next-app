"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SentenceCard } from "@/components/sentence-card";
import { AIResultPanel, defaultAIAnalysis } from "@/components/ai-result-panel";
import { VoiceComparisonPanel } from "@/components/voice-comparison-panel";
import { CustomSentenceUpload } from "@/components/custom-sentence-upload";
import { PronunciationChallenge } from "@/components/pronunciation-challenge";
import { type WaveformPlayerHandle } from "@/components/waveform-player";
import { getAuthStatus } from "@/lib/auth-utils";

interface TrainingTabsProps {
  initialCustomSentence?: string;
  initialTab?: string;
}

interface SentenceData {
  text: string;
  voiceUrl?: string;
}

export function TrainingTabs({ initialCustomSentence, initialTab }: TrainingTabsProps) {
  const [sentence, setSentence] = useState<string>("");
  const [voiceUrl1, setVoiceUrl1] = useState<string | undefined>(undefined);
  const [voiceUrl2, setVoiceUrl2] = useState<string | undefined>(undefined);
  const [voiceUrl3, setVoiceUrl3] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || "short");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [customSentence, setCustomSentence] = useState(initialCustomSentence || "");
  const [myVoiceUrl, setMyVoiceUrl] = useState<string | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [userRecordingUrl, setUserRecordingUrl] = useState<string | null>(null);
  const waveformRef = useRef<WaveformPlayerHandle>(null!);
  const router = useRouter();

  // Set initial custom sentence and tab when component mounts
  useEffect(() => {
    if (initialCustomSentence) {
      setCustomSentence(initialCustomSentence);
      setSentence(initialCustomSentence);
    }
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialCustomSentence, initialTab]);

  // // Separate useEffect for handling scroll
  // useEffect(() => {
  //   // Only scroll if we have both customSentence and scroll=true in URL
  //   const shouldScroll = searchParams.get("scroll") === "true" && initialCustomSentence;
  //   if (shouldScroll) {
  //     // Add a small delay to ensure the content is rendered
  //     setTimeout(() => {
  //       window.scrollTo({
  //         top: document.body.scrollHeight,
  //         behavior: 'smooth'
  //       });
  //     }, 100);
  //   }
  // }, [searchParams, initialCustomSentence]);

  // 탭에 따라 API에서 무작위 문장을 가져오는 함수 // 250609 박남규
  async function fetchRandomSentence(tab: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/sentences?type=${tab}`);
      if (!res.ok) throw new Error("Failed to fetch sentence");
      const data = await res.json();
      if (!data) throw new Error("No sentence data received");
      
      console.log("=== API Response Details ===");
      console.log("Full Response:", data);
      console.log("Response Type:", typeof data);
      console.log("Response Keys:", Object.keys(data));
      console.log("Response Values:", Object.values(data));
      console.log("=========================");
      
      // API 응답 구조에 따라 적절한 필드 사용
      const sentenceText = data.sentence || data.text || "";
      const voiceUrl1 = data.voiceUrl1;  // 김주하 아나운서
      const voiceUrl2 = data.voiceUrl2;  // 이동욱 아나운서
      const voiceUrl3 = data.voiceUrl3;  // 박소현 아나운서
      
      console.log("Extracted sentence:", sentenceText);

      console.log("Extracted voiceUrls:", { voiceUrl1, voiceUrl2, voiceUrl3 });
      
      setSentence(sentenceText);
      setVoiceUrl1(voiceUrl1);
      setVoiceUrl2(voiceUrl2);
      setVoiceUrl3(voiceUrl3);
      
      if (!voiceUrl1 && !voiceUrl2 && !voiceUrl3) {
        console.warn("No voiceUrls found in API response. Available fields:", Object.keys(data));
      }
    } catch (error) {
      console.error("문장 불러오기 실패:", error);
      setSentence("");
      setVoiceUrl1(undefined);
      setVoiceUrl2(undefined);
      setVoiceUrl3(undefined);
    } finally {
      setLoading(false);
      setHasRecorded(false);
      setMyVoiceUrl(null);
      setAnalysisResult(null);  // 분석 결과 초기화
    }
  }

  // 탭 변경 시 문장을 새로 불러오는 useEffect
  useEffect(() => {
    setHasRecorded(false);
    setMyVoiceUrl(null);
    if (activeTab === "custom") {
      setSentence(customSentence);
      setHasRecorded(false);
      setMyVoiceUrl(null);
      setAnalysisResult(null);  // 분석 결과 초기화
      return;
    }
    if (["short", "long", "news"].includes(activeTab)) {
      fetchRandomSentence(activeTab);
    }
  }, [activeTab, customSentence]);
  
  // 탭을 변경하면 녹음 상태 초기화
  useEffect(() => {
    if (isRecording) {
      setIsRecording(false);
    }
  }, [activeTab]);

  // 새로고침 버튼 클릭 시 문장 새로고침
  const handleRefreshSentence = () => {
    if (["short", "long", "news"].includes(activeTab)) {
      fetchRandomSentence(activeTab);
    }
  };

  const handleRecord = () => {
    setIsRecording(prevIsRecording => {
      if (prevIsRecording) {
        setHasRecorded(true);
      }
      return !prevIsRecording;
    });
  };

  const handleCustomSentenceSelect = (sentence: string) => {
    setCustomSentence(sentence);
    setHasRecorded(false);
    setMyVoiceUrl(null);
    setAnalysisResult(null);  // 분석 결과 초기화
  };

  const handleAnalysisComplete = async (result: any, refUrl?: string, userUrl?: string) => {
    console.log("TrainingTabs에서 분석 결과 받음:", result);
    setAnalysisResult(result);
    if (refUrl) setReferenceUrl(refUrl);
    if (userUrl) setUserRecordingUrl(userUrl);

    // AI 분석 결과가 나오면 자동으로 저장
    try {
      const { userProfile } = getAuthStatus()
      if (!userProfile?.email) {
        console.log("사용자가 로그인하지 않았습니다. 자동 저장을 건너뜁니다.");
        return;
      }

      const categories: { [key: string]: string } = {
        short: '짧은 문장',
        long: '긴 문장',
        news: '뉴스 읽기',
        custom: '내문장 업로드',
        challenge: '발음 챌린지',
      }

      const record = {
        date: new Date().toISOString().slice(0, 10),
        category: categories[activeTab],
        sentence: activeTab === "custom" ? customSentence : sentence,
        analysisResult: result,
        referenceUrl: refUrl,
        userRecordingUrl: userUrl,
        voiceUrl: myVoiceUrl,
        email: userProfile.email,
      }

      const response = await fetch('/api/training-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })

      if (response.ok) {
        console.log('AI 분석 결과가 자동으로 저장되었습니다.');
      } else {
        console.error('자동 저장 실패:', await response.text());
      }
    } catch (err) {
      console.error('자동 저장 중 오류 발생:', err);
    }
  };

  const handleSaveRecord = async () => {
    const { userProfile } = getAuthStatus()
    const categories: { [key: string]: string } = {
      short: '짧은 문장',
      long: '긴 문장',
      news: '뉴스 읽기',
      custom: '내문장 업로드',
      challenge: '발음 챌린지',
    }
    const record = {
      date: new Date().toISOString().slice(0, 10),
      category: categories[activeTab],
      sentence: activeTab === "custom" ? customSentence : sentence,
      analysisResult: analysisResult,
      referenceUrl: referenceUrl,
      userRecordingUrl: userRecordingUrl,
      voiceUrl: myVoiceUrl,
      email: userProfile?.email,
    }
    try {
      await fetch('/api/training-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
      alert('기록이 저장되었습니다.')
      
      // 기록 저장 후 훈련 기록 페이지로 이동할지 묻는 팝업창
      const goToHistory = confirm('훈련 기록으로 이동하시겠습니까?')
      if (goToHistory) {
        router.push('/history')
      }
    } catch (err) {
      console.error('Failed to save record', err)
    }
  }

  if (loading) return <div className="text-center py-10">문장을 불러오는 중...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-onair-bg-sub">
          <TabsTrigger value="short" className="text-xs sm:text-sm data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">짧은 문장</TabsTrigger>
          <TabsTrigger value="long" className="text-xs sm:text-sm data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">긴 문장</TabsTrigger>
          <TabsTrigger value="news" className="text-xs sm:text-sm data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">뉴스 읽기</TabsTrigger>
          <TabsTrigger value="custom" className="text-xs sm:text-sm data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">내문장 업로드</TabsTrigger>
          <TabsTrigger value="challenge" className="text-xs sm:text-sm data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">발음 챌린지</TabsTrigger>
        </TabsList>

        {["short", "long", "news"].map((key) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-onair-text mb-2">
                {key === "short" ? "짧은 문장" : key === "long" ? "긴 문장" : "뉴스 읽기"}
              </h2>
            </div>
            
            <SentenceCard
              sentence={sentence}
              voiceUrl1={voiceUrl1}
              voiceUrl2={voiceUrl2}
              voiceUrl3={voiceUrl3}
              onRefresh={handleRefreshSentence}
              currentTab={activeTab}
              onSentenceChange={setSentence}
              isRecording={isRecording}
              onRecord={handleRecord}
              hasRecorded={hasRecorded}
              onNext={handleRefreshSentence}
              canNext={true}
              waveformRef={waveformRef}
              onRecordingComplete={setMyVoiceUrl}
              onAnalysisComplete={handleAnalysisComplete}
            />
          
             {hasRecorded && analysisResult && (
              <div className="space-y-6">
                {/* <VoiceComparisonPanel myVoiceUrl={myVoiceUrl} waveformRef={waveformRef} /> */}
                <AIResultPanel 
                  myVoiceUrl={myVoiceUrl} 
                  referenceUrl={referenceUrl}
                  userRecordingUrl={userRecordingUrl}
                  waveformRef={waveformRef} 
                  analysisResult={analysisResult} 
                />
              </div>
            )}
          </TabsContent>
        ))}

        <TabsContent value="custom" className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-onair-text mb-2">내문장 업로드</h2>
            <p className="text-onair-text-sub">원하는 문장을 업로드하여 맞춤형 훈련을 시작하세요</p>
          </div>

          <CustomSentenceUpload onSentenceSelect={handleCustomSentenceSelect} />

          <SentenceCard
            sentence={customSentence}
            voiceUrl1={undefined}
            voiceUrl2={undefined}
            voiceUrl3={undefined}
            currentTab={activeTab}
            onSentenceChange={setCustomSentence}
            isRecording={isRecording}
            onRecord={handleRecord}
            hasRecorded={hasRecorded}
            onNext={() => {}}
            canNext={false}
            waveformRef={waveformRef}
            onRecordingComplete={setMyVoiceUrl}
            onAnalysisComplete={handleAnalysisComplete}
          />

          {hasRecorded && analysisResult && (
            <div className="space-y-6">
              {/* <VoiceComparisonPanel myVoiceUrl={myVoiceUrl} waveformRef={waveformRef} /> */}
              <AIResultPanel 
                myVoiceUrl={myVoiceUrl} 
                referenceUrl={referenceUrl}
                userRecordingUrl={userRecordingUrl}
                waveformRef={waveformRef} 
                analysisResult={analysisResult} 
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenge" className="space-y-6">
        <PronunciationChallenge
          isRecording={isRecording}
          onRecord={handleRecord}
          hasRecorded={hasRecorded}
          onReset={() => {
            setHasRecorded(false);
            setMyVoiceUrl(null);
            setAnalysisResult(null);  // 분석 결과 초기화
          }}
          onAnalysisComplete={handleAnalysisComplete}
        />

          {hasRecorded && analysisResult && (
            <div className="space-y-6">
              {/* <VoiceComparisonPanel myVoiceUrl={myVoiceUrl} waveformRef={waveformRef} /> */}
              <AIResultPanel 
                myVoiceUrl={myVoiceUrl} 
                referenceUrl={referenceUrl}
                userRecordingUrl={userRecordingUrl}
                waveformRef={waveformRef} 
                analysisResult={analysisResult} 
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
