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
      waveColor: 'rgb(145, 145, 145)', // 회색 (정답/참조)
      progressColor: 'rgba(255, 255, 255, 0.9)',
      height: 150,
      normalize: true,
      interact: true,
      hideScrollbar: true,
      fillParent: true,
      minPxPerSec: 50,
    });

    // 앞쪽 파형 (male.wav) - 앞에 표시
    ws2.current = WaveSurfer.create({
      container: ref2.current,
      waveColor: 'rgba(121, 172, 253, 0.7)', // 파란색 (사용자/비교)
      progressColor: 'rgba(41, 111, 224, 0.9)',
      height: 150,
      normalize: true,
      interact: true,
      hideScrollbar: true,
      fillParent: true,
      minPxPerSec: 50,
    });

    // ws1.current = WaveSurfer.create({
    //   container: ref1.current,
    //   waveColor: 'rgba(224,224,224,1)',
    //   progressColor: 'rgba(208,208,208,1)',
    //   height: 150,
    //   normalize: true,
    //   interact: true,
    //   hideScrollbar: true,
    // });
    // ws2.current = WaveSurfer.create({
    //   container: ref2.current,
    //   waveColor: 'rgba(74,144,226,0.5)',
    //   progressColor: 'rgba(0,51,102,0.5)',
    //   height: 150,
    //   normalize: true,
    //   interact: true,
    //   hideScrollbar: true,
    // });

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
      {/* 컨트롤 영역: 토글 버튼과 재생 버튼 */}
      <div className="flex items-center gap-2 mb-4">
        {/* 토글 버튼 */}
        <div className="inline-flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => changeVersion('ai')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
              version === 'ai'
                ? 'bg-slate-300 text-slate-800'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            AI 음성
          </button>
          <button
            onClick={() => changeVersion('user')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
              version === 'user'
                ? 'text-white'
                : 'text-slate-300 hover:text-white'
            }`}
            style={{
              backgroundColor: version === 'user' ? 'rgb(69, 135, 243)' : 'transparent'
            }}
          >
            내 음성
          </button>
        </div>

        {/* 재생/일시정지 버튼 */}
        <button
          onClick={togglePlay}
          className="w-8 h-8 bg-transparent text-gray-300 rounded-full text-xs transition-colors flex items-center justify-center border-2 border-gray-400 hover:bg-white/10 hover:border-white"
        >
          {playing ? '⏸' : '▶'}
        </button>
      </div>

      <div className="relative border rounded-lg p-2" style={{ height: '150px' }}>
        {/* 배경 파형 */}
        <div
          ref={ref1}
          className="absolute inset-0"
          style={{ zIndex: 1 }}
        ></div>
        {/* 앞쪽 파형 */}
        <div
          ref={ref2}
          className="absolute inset-0"
          style={{ zIndex: 2 }}
        ></div>
      </div>
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
