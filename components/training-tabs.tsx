"use client";

import { useEffect, useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SentenceCard } from "@/components/sentence-card";
import { AIResultPanel, defaultAIResults } from "@/components/ai-result-panel";
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
  const [voiceUrl, setVoiceUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || "short");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [customSentence, setCustomSentence] = useState(initialCustomSentence || "");
  const [myVoiceUrl, setMyVoiceUrl] = useState<string | null>(null);
  const waveformRef = useRef<WaveformPlayerHandle>(null!);

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

  // 탭에 따라 API에서 무작위 문장을 가져오는 함수
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
      const voiceUrl = data.audioUrl;  // audioUrl을 voiceUrl로 사용
      
      console.log("Extracted sentence:", sentenceText);
      console.log("Extracted voiceUrl:", voiceUrl);
      
      setSentence(sentenceText);
      setVoiceUrl(voiceUrl);
      
      if (!voiceUrl) {
        console.warn("No voiceUrl found in API response. Available fields:", Object.keys(data));
      }
    } catch (error) {
      console.error("문장 불러오기 실패:", error);
      setSentence("");
      setVoiceUrl(undefined);
    } finally {
      setLoading(false);
      setHasRecorded(false);
      setMyVoiceUrl(null);
    }
  }

  // 탭 변경 시 문장을 새로 불러오는 useEffect
  useEffect(() => {
    if (activeTab === "custom") {
      setSentence(customSentence);
      setHasRecorded(false);
      setMyVoiceUrl(null);
      return;
    }
    if (["short", "long", "news"].includes(activeTab)) {
      fetchRandomSentence(activeTab);
    }
  }, [activeTab, customSentence]);

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
      sentence,
      scores: defaultAIResults,
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
    } catch (err) {
      console.error('Failed to save record', err)
    }
  }

  if (loading) return <div className="text-center py-10">문장을 불러오는 중...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-onair-bg-sub">
          <TabsTrigger value="short" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">짧은 문장</TabsTrigger>
          <TabsTrigger value="long" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">긴 문장</TabsTrigger>
          <TabsTrigger value="news" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">뉴스 읽기</TabsTrigger>
          <TabsTrigger value="custom" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">내문장 업로드</TabsTrigger>
          <TabsTrigger value="challenge" className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg">발음 챌린지</TabsTrigger>
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
              voiceUrl={voiceUrl}
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
            />
          
             {hasRecorded && (
              <div className="space-y-6">
                <AIResultPanel />
                <VoiceComparisonPanel myVoiceUrl={myVoiceUrl} waveformRef={waveformRef} />
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
            voiceUrl={undefined}
            currentTab={activeTab}
            onSentenceChange={setCustomSentence}
            isRecording={isRecording}
            onRecord={handleRecord}
            hasRecorded={hasRecorded}
            onNext={() => {}}
            canNext={false}
            waveformRef={waveformRef}
            onRecordingComplete={setMyVoiceUrl}
          />

          {hasRecorded && (
            <div className="space-y-6">
              <AIResultPanel />
              <VoiceComparisonPanel myVoiceUrl={myVoiceUrl} waveformRef={waveformRef} />
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
          }}
        />

          {hasRecorded && (
            <div className="space-y-6">
              <AIResultPanel />
              <VoiceComparisonPanel myVoiceUrl={myVoiceUrl} waveformRef={waveformRef} />
            </div>
          )}
        </TabsContent>
      </Tabs>
      {hasRecorded && (
        <div className="text-center mt-6">
          <button
            onClick={handleSaveRecord}
            className="px-4 py-2 bg-onair-mint text-onair-bg rounded hover:bg-onair-mint/90"
          >
            기록 저장
          </button>
        </div>
      )}
    </div>
  );
}
