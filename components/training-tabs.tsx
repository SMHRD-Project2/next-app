"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SentenceCard } from "@/components/sentence-card";
import { RecordController } from "@/components/record-controller";
import { AIResultPanel } from "@/components/ai-result-panel";
import { VoiceComparisonPanel } from "@/components/voice-comparison-panel";
import { CustomSentenceUpload } from "@/components/custom-sentence-upload";
import { PronunciationChallenge } from "@/components/pronunciation-challenge";

export function TrainingTabs() {
  const [sentence, setSentence] = useState<string>(""); // 현재 문장 상태 // 250609 박남규
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("short");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [customSentence, setCustomSentence] = useState("");

  // 탭에 따라 API에서 무작위 문장을 가져오는 함수 // 250609 박남규
  async function fetchRandomSentence(tab: string) {
    setLoading(true);
    try {
      // short, long, news 탭의 경우 해당 type을 query로 전달하여 문장 요청 // 250609 박남규
      const res = await fetch(`/api/sentences?type=${tab}`);
      if (!res.ok) throw new Error("Failed to fetch sentence");
      const data = await res.json();
      if (!data) throw new Error("No sentence data received");
      setSentence(data.text || "");
    } catch (error) {
      console.error("문장 불러오기 실패:", error);
      setSentence("");
    } finally {
      setLoading(false);
      setHasRecorded(false);
    }
  }

  // 탭 변경 시 문장을 새로 불러오는 useEffect // 250609 박남규
  useEffect(() => {
    if (activeTab === "custom") {
      setSentence(customSentence);
      setHasRecorded(false);
      return;
    }
    if (["short", "long", "news"].includes(activeTab)) {
      fetchRandomSentence(activeTab); // 해당 type에 맞는 문장 불러오기 // 250609 박남규
    }
  }, [activeTab, customSentence]);

  // 새로고침 버튼 클릭 시 문장 새로고침 // 250609 박남규
  const handleRefreshSentence = () => {
    if (["short", "long", "news"].includes(activeTab)) {
      fetchRandomSentence(activeTab);
    }
  };

  const handleRecord = () => {
    setIsRecording(prevIsRecording => {
      if (prevIsRecording) { // 녹음 중이었다면 (이제 중지될 것이므로)
        setHasRecorded(true); // 녹음이 완료되었음을 표시
      }
      return !prevIsRecording; // isRecording 상태 토글 (true -> false, false -> true)
    });
  };

  const handleCustomSentenceSelect = (sentence: string) => {
    setCustomSentence(sentence);
    setHasRecorded(false);
  };

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
              onRefresh={handleRefreshSentence} 
              currentTab={activeTab}
              onSentenceChange={setSentence} 
            />

            <RecordController
              isRecording={isRecording}
              onRecord={handleRecord}
              hasRecorded={hasRecorded}
              onNext={handleRefreshSentence}
              canNext={true}
            />

            {hasRecorded && (
              <div className="space-y-6">
                <AIResultPanel />
                <VoiceComparisonPanel />
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

          {customSentence && (
            <>
              <SentenceCard 
                sentence={customSentence} 
                onRefresh={() => {}} 
                currentTab={activeTab} 
              />
              <RecordController
                isRecording={isRecording}
                onRecord={handleRecord}
                hasRecorded={hasRecorded}
                onNext={() => {}}
                canNext={false}
              />

              {hasRecorded && (
                <div className="space-y-6">
                  <AIResultPanel />
                  <VoiceComparisonPanel />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="challenge" className="space-y-6">
          <PronunciationChallenge
            isRecording={isRecording}
            onRecord={handleRecord}
            hasRecorded={hasRecorded}
            onReset={() => setHasRecorded(false)}
          />

          {/* AI 분석 결과 및 음성 비교 분석 패널 배치 */}
          {hasRecorded && (
            <div className="space-y-6">
              <AIResultPanel />
              <VoiceComparisonPanel />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
