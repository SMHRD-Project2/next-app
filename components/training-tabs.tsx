"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SentenceCard } from "@/components/sentence-card";
import { RecordController } from "@/components/record-controller";
import { AIResultPanel } from "@/components/ai-result-panel";
import { VoiceComparisonPanel } from "@/components/voice-comparison-panel";
import { CustomSentenceUpload } from "@/components/custom-sentence-upload";
import { PronunciationChallenge } from "@/components/pronunciation-challenge";

// 250606 박남규 수정: 각 탭별 currentSentenceIndex를 관리하는 상태
export function TrainingTabs() {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<
    Record<string, number>
  >({
    short: 0,
    long: 0,
    news: 0,
    custom: 0,
    challenge: 0,
  });
  const [trainingData, setTrainingData] = useState<
    Record<string, { title: string; sentences: string[] }>
  >({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("short");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [customSentence, setCustomSentence] = useState("");

  // 250606 박남규 수정: 새로고침 함수 (탭별로 동작)
  const handleRefreshSentence = () => {
    if (!trainingData[activeTab]) return;
    const sentences = trainingData[activeTab].sentences;
    if (sentences.length <= 1) return;

    // 250606 박남규 수정: 현재 탭의 인덱스만 변경
    setCurrentSentenceIndex((prev) => ({
      ...prev,
      [activeTab]: (() => {
        let newIndex = prev[activeTab] || 0;
        while (newIndex === prev[activeTab]) {
          newIndex = Math.floor(Math.random() * sentences.length);
        }
        return newIndex;
      })(),
    }));
    setHasRecorded(false);
  };

  // 250606 박남규 수정: 다음 문장 함수 (탭별로 동작)
  const handleNextSentence = () => {
    if (!trainingData[activeTab]) return;
    const sentences = trainingData[activeTab].sentences;
    const currentIndex = currentSentenceIndex[activeTab] || 0;

    if (currentIndex < sentences.length - 1) {
      // 250606 박남규 수정: 현재 탭의 인덱스만 변경
      setCurrentSentenceIndex((prev) => ({
        ...prev,
        [activeTab]: currentIndex + 1,
      }));
      setHasRecorded(false);
    }
  };

  useEffect(() => {
    async function fetchSentences() {
      try {
        const res = await fetch("/api/sentences");
        const data = await res.json();

        setTrainingData({
          short: { title: "짧은 문장", sentences: data.short || [] },
          long: { title: "긴 문장", sentences: data.long || [] },
          news: { title: "뉴스 읽기", sentences: data.news || [] },
        });
        setLoading(false);
      } catch (err) {
        console.error("문장 데이터 불러오기 실패:", err);
      }
    }

    fetchSentences();
  }, []);

  // 250606 박남규 수정: 현재 문장 (탭별로 currentSentenceIndex 적용)
  const currentData = trainingData[activeTab];
  const currentIndex = currentSentenceIndex[activeTab] || 0;
  const currentSentence =
    activeTab === "custom"
      ? customSentence
      : currentData?.sentences[currentIndex] || "";

  const handleRecord = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      setHasRecorded(true);
    }
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
          <TabsTrigger
            value="short"
            className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg"
          >
            짧은 문장
          </TabsTrigger>
          <TabsTrigger
            value="long"
            className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg"
          >
            긴 문장
          </TabsTrigger>
          <TabsTrigger
            value="news"
            className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg"
          >
            뉴스 읽기
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg"
          >
            내문장 업로드
          </TabsTrigger>
          <TabsTrigger
            value="challenge"
            className="data-[state=active]:bg-onair-mint data-[state=active]:text-onair-bg"
          >
            발음 챌린지
          </TabsTrigger>
        </TabsList>

        {["short", "long", "news"].map((key) => {
          const data = trainingData[key];
          return (
            <TabsContent key={key} value={key} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-onair-text mb-2">{data.title}</h2>
                {/* 250606 박남규 수정: 탭별 문장 인덱스 표시 */}
                {/* <p className="text-onair-text-sub">
                  문장 {(currentSentenceIndex[key] || 0) + 1} / {data.sentences.length}
                </p> */}
              </div>
              {/* 250606 박남규 수정: SentenceCard 에 onRefresh prop 전달 */}
              <SentenceCard sentence={currentSentence} onRefresh={handleRefreshSentence} />
              <RecordController
                isRecording={isRecording}
                onRecord={handleRecord}
                hasRecorded={hasRecorded}
                onNext={handleNextSentence}
                canNext={
                  currentData &&
                  currentSentenceIndex[key] !== undefined &&
                  currentSentenceIndex[key] < data.sentences.length - 1
                }
              />

              {hasRecorded && (
                <div className="space-y-6">
                  <AIResultPanel />
                  <VoiceComparisonPanel />
                </div>
              )}
            </TabsContent>
          );
        })}
        {/* 내문장 업로드 탭 */}
        <TabsContent value="custom" className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-onair-text mb-2">내문장 업로드</h2>
            <p className="text-onair-text-sub">원하는 문장을 업로드하여 맞춤형 훈련을 시작하세요</p>
          </div>

          <CustomSentenceUpload onSentenceSelect={handleCustomSentenceSelect} />

          {customSentence && (
            <>
              {/* 250606 박남규 수정: SentenceCard 에 onRefresh prop 전달 */}
              <SentenceCard sentence={customSentence} onRefresh={() => {}} />
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

        {/* 발음 챌린지 탭 */}
        <TabsContent value="challenge" className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-onair-text mb-2">발음 챌린지</h2>
            <p className="text-onair-text-sub">어려운 발음에 도전하여 실력을 한 단계 업그레이드하세요</p>
          </div>

          <PronunciationChallenge
            isRecording={isRecording}
            onRecord={handleRecord}
            hasRecorded={hasRecorded}
            onReset={() => setHasRecorded(false)}
          />

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
