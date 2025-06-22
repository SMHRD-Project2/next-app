// components/WaveCompare.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

/* ────────────────────────────────  유틸 함수  ──────────────────────────────── */
// 무발화(정적) 구간을 건너뛰고 실제 음성 시작 샘플 인덱스를 찾음
function detectOnset(
  data: Float32Array,
  sampleRate: number,
  threshold = 0.02, // RMS 임계값
  minVoiced = 0.15  // 150 ms 이상 소리가 지속돼야 발화로 인정
) {
  const win = Math.floor(sampleRate * minVoiced);
  let sum = 0;
  for (let i = 0; i < win; i++) sum += Math.abs(data[i]);
  for (let i = win; i < data.length - win; i++) {
    sum += Math.abs(data[i]) - Math.abs(data[i - win]);
    if (sum / win > threshold) return Math.max(i - win, 0);
  }
  return 0; // 전부 무음이라면 0
}

/* fetch → decode → onset 이후만 잘라서 새 AudioBuffer 반환 */
async function fetchAndTrim(url: string): Promise<AudioBuffer> {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const raw = await (await fetch(url)).arrayBuffer();
  const buf = await ctx.decodeAudioData(raw);

  const onset = detectOnset(buf.getChannelData(0), buf.sampleRate);
  const len = buf.length - onset;

  const trimmed = ctx.createBuffer(buf.numberOfChannels, len, buf.sampleRate);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    trimmed.getChannelData(ch).set(buf.getChannelData(ch).slice(onset));
  }
  return trimmed;
}
/* ──────────────────────────────────────────────────────────────────────────── */

interface WaveCompareProps {
  audioFile1?: string; // 정답 음성
  audioFile2?: string; // 사용자 음성
  label1?: string;
  label2?: string;
}

const WaveCompare: React.FC<WaveCompareProps> = ({
  audioFile1 = '/audio/female.wav',
  audioFile2 = '/audio/male.wav',
  label1 = 'Female (정답) - 배경',
  label2 = 'Male (사용자) - DTW 정렬됨',
}) => {
  // S3 URL은 프록시 경유
  const proxify = (url: string) =>
    url.startsWith('https://tennyvoice.s3.ap-northeast-2.amazonaws.com/')
      ? `/api/audio-proxy?url=${encodeURIComponent(url)}`
      : url;

  const [buf1, setBuf1] = useState<AudioBuffer | null>(null);
  const [buf2, setBuf2] = useState<AudioBuffer | null>(null);

  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ws1 = useRef<WaveSurfer | null>(null);
  const ws2 = useRef<WaveSurfer | null>(null);

  const [version, setVersion] = useState<'ai' | 'user'>('ai');
  const [playing, setPlaying] = useState(false);

  /* 1. 오디오 가져와서 트리밍 */
  useEffect(() => {
    (async () => {
      const [b1, b2] = await Promise.all([
        fetchAndTrim(proxify(audioFile1)),
        fetchAndTrim(proxify(audioFile2)),
      ]);
      setBuf1(b1);
      setBuf2(b2);
    })();
  }, [audioFile1, audioFile2]);

  /* 2. WaveSurfer 인스턴스 생성 & AudioBuffer 로드 */
  useEffect(() => {
    if (!ref1.current || !ref2.current || !buf1 || !buf2) return;

    ws1.current = WaveSurfer.create({
      container: ref1.current,
      waveColor: 'rgba(224,224,224,1)',
      progressColor: 'rgba(208,208,208,1)',
      height: 150,
      normalize: true,
      interact: true,
      hideScrollbar: true,
    });
    ws2.current = WaveSurfer.create({
      container: ref2.current,
      waveColor: 'rgba(74,144,226,0.5)',
      progressColor: 'rgba(0,51,102,0.5)',
      height: 150,
      normalize: true,
      interact: true,
      hideScrollbar: true,
    });

    // 원본 URL로 로드 (안정적인 방법)
    ws1.current.load(proxify(audioFile1));
    ws2.current.load(proxify(audioFile2));

    const addEvents = (ws: WaveSurfer | null) => {
      ws?.on('play', () => setPlaying(true));
      ws?.on('pause', () => setPlaying(false));
      ws?.on('finish', () => setPlaying(false));
    };
    addEvents(ws1.current);
    addEvents(ws2.current);

    return () => {
      ws1.current?.destroy();
      ws2.current?.destroy();
    };
  }, [buf1, buf2]);

  /* 3. 재생 컨트롤 */
  const togglePlay = () => {
    if (playing) {
      ws1.current?.pause();
      ws2.current?.pause();
    } else {
      (version === 'ai' ? ws1.current : ws2.current)?.play();
    }
  };

  const changeVersion = (v: 'ai' | 'user') => {
    ws1.current?.pause();
    ws2.current?.pause();
    ws1.current?.seekTo(0);
    ws2.current?.seekTo(0);
    setVersion(v);
  };

  return (
    <div className="p-4">
      {/* 음성 선택 라디오 */}
      <div className="mb-4 flex gap-6">
        {['ai', 'user'].map(v => (
          <label key={v} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="version"
              value={v}
              checked={version === v}
              onChange={() => changeVersion(v as 'ai' | 'user')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"
            />
            <span className="text-sm font-medium">
              {v === 'ai' ? 'AI 음성' : '내 음성'}
            </span>
          </label>
        ))}
      </div>

      {/* 파형 오버레이 */}
      <div className="mb-4">
        <div className="flex gap-4 mb-2">
          <Legend color="bg-gray-400" text={label1} />
          <Legend color="bg-blue-500" text={label2} />
        </div>
        <div className="relative border rounded-lg p-2" style={{ height: 150 }}>
          <div ref={ref1} className="absolute inset-0 z-10" />
          <div ref={ref2} className="absolute inset-0 z-20" />
        </div>
      </div>

      <button
        onClick={togglePlay}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {playing ? '일시정지' : '재생'} (
        {version === 'ai' ? 'AI 음성' : '내 음성'})
      </button>
    </div>
  );
};

/* 작은 레전드 컴포넌트 */
const Legend = ({ color, text }: { color: string; text: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 ${color} rounded`} />
    <span className="text-sm">{text}</span>
  </div>
);

export default WaveCompare;
