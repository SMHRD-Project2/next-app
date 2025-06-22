// components/WaveCompare.tsx  (WaveSurfer v7 기준)
'use client';

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import audioBufferToWav from 'audiobuffer-to-wav';

/* ────────────────── 1. librosa.effects.trim() JS 버전 ────────────────── */
function trimSilence(
  buf: AudioBuffer,
  topDb = 20,          /* librosa 기본값 */
  frameLen = 2048,
  hopLen = 512
): AudioBuffer {
  const chan = buf.getChannelData(0);
  const nFrames = Math.floor((chan.length - frameLen) / hopLen) + 1;

  /* 1-1. 모든 프레임 RMS → dBFS */
  const rmsDb: number[] = [];
  for (let i = 0; i < nFrames; i++) {
    let sum = 0;
    for (let j = 0; j < frameLen; j++) {
      const s = chan[i * hopLen + j];
      sum += s * s;
    }
    const rms = Math.sqrt(sum / frameLen);
    rmsDb.push(20 * Math.log10(rms + 1e-10)); // dBFS
  }

  /* 1-2. 최고 dB – topDb 보다 작은 프레임은 무음으로 간주 */
  const maxDb = Math.max(...rmsDb);
  const threshold = maxDb - topDb;

  let startFrame = 0;
  while (startFrame < nFrames && rmsDb[startFrame] < threshold) startFrame++;

  let endFrame = nFrames - 1;
  while (endFrame >= 0 && rmsDb[endFrame] < threshold) endFrame--;

  /* 무음뿐이면 원본 반환 */
  if (startFrame >= endFrame) return buf;

  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const startSample = startFrame * hopLen;
  const endSample = Math.min(buf.length, endFrame * hopLen + frameLen);
  const newLen = endSample - startSample;
  const trimmed = ctx.createBuffer(buf.numberOfChannels, newLen, buf.sampleRate);

  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    trimmed
      .getChannelData(ch)
      .set(buf.getChannelData(ch).slice(startSample, endSample));
  }
  return trimmed;
}

/* ────────────────── 2. fetch → decode → trim ────────────────── */
async function fetchAndTrimSilence(url: string, topDb = 20): Promise<AudioBuffer> {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const raw = await (await fetch(url)).arrayBuffer();
  const buf = await ctx.decodeAudioData(raw);
  return trimSilence(buf, topDb);
}

/* ────────────────── 3. AudioBuffer → WAV URL ────────────────── */
function bufferToWavURL(buffer: AudioBuffer): string {
  const wavData = audioBufferToWav(buffer, { float32: false });
  const blob = new Blob([wavData], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/* ────────────────── 4. 메인 컴포넌트 ────────────────── */
interface WaveCompareProps {
  audioFile1?: string;
  audioFile2?: string;
  label1?: string;
  label2?: string;
  topDb?: number;            // 무음 판정 기준 (기본 20 dB)
}
const WaveCompare: React.FC<WaveCompareProps> = ({
  audioFile1 = '/audio/female.wav',
  audioFile2 = '/audio/male.wav',
  label1 = '참조 음성',
  label2 = '사용자 음성',
  topDb = 18,
}) => {
  const proxify = (u: string) =>
    u.startsWith('https://tennyvoice.s3.ap-northeast-2.amazonaws.com/')
      ? `/api/audio-proxy?url=${encodeURIComponent(u)}`
      : u;

  const [url1, setUrl1] = useState<string | null>(null);
  const [url2, setUrl2] = useState<string | null>(null);
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ws1 = useRef<WaveSurfer | null>(null);
  const ws2 = useRef<WaveSurfer | null>(null);
  const [version, setVersion] = useState<'ai' | 'user'>('ai');
  const [playing, setPlaying] = useState(false);

  /* 1) 음성 가져와서 trim & WAV URL 생성 */
  useEffect(() => {
    (async () => {
      const [b1, b2] = await Promise.all([
        fetchAndTrimSilence(proxify(audioFile1), topDb),
        fetchAndTrimSilence(proxify(audioFile2), topDb),
      ]);
      setUrl1(bufferToWavURL(b1));
      setUrl2(bufferToWavURL(b2));
    })();
    return () => {
      url1 && URL.revokeObjectURL(url1);
      url2 && URL.revokeObjectURL(url2);
    };
  }, [audioFile1, audioFile2, topDb]);

  /* 2) WaveSurfer v7 로드 */
  useEffect(() => {
    if (!ref1.current || !ref2.current || !url1 || !url2) return;
    ws1.current = WaveSurfer.create({
      container: ref1.current,
      waveColor: 'rgb(160,160,160)',
      progressColor: 'rgba(255,255,255,0.9)',
      height: 140,
      normalize: true,
      interact: true,
      fillParent: true,
      minPxPerSec: 50,
    });
    ws2.current = WaveSurfer.create({
      container: ref2.current,
      waveColor: 'rgba(121,172,253,0.7)',
      progressColor: 'rgba(41,111,224,0.9)',
      height: 140,
      normalize: true,
      interact: true,
      fillParent: true,
      minPxPerSec: 50,
    });
    Promise.all([ws1.current.load(url1), ws2.current.load(url2)]);
    const ev = (w: WaveSurfer | null) => {
      w?.on('play', () => setPlaying(true));
      w?.on('pause', () => setPlaying(false));
      w?.on('finish', () => setPlaying(false));
    };
    ev(ws1.current); ev(ws2.current);
    return () => { ws1.current?.destroy(); ws2.current?.destroy(); };
  }, [url1, url2]);

  /* 재생 컨트롤 */
  const togglePlay = () =>
    playing ? (ws1.current?.pause(), ws2.current?.pause()) :
    (version === 'ai' ? ws1.current : ws2.current)?.play();

  const changeVersion = (v: 'ai' | 'user') => {
    ws1.current?.pause(); ws2.current?.pause();
    ws1.current?.seekTo(0); ws2.current?.seekTo(0);
    setVersion(v);
  };

  return (
    <div className="p-4">
      {/* 컨트롤 */}
      <div className="flex items-center gap-2 mb-4">
        <Toggle version={version} changeVersion={changeVersion}/>
        <button onClick={togglePlay}
          className="w-8 h-8 text-gray-300 border-2 border-gray-400 rounded-full flex items-center justify-center hover:bg-white/10">
          {playing ? '⏸' : '▶'}
        </button>
      </div>
      {/* 파형 */}
      <div className="relative border rounded p-2" style={{height:150}}>
        <div ref={ref1} className="absolute inset-0 z-10"/>
        <div ref={ref2} className="absolute inset-0 z-20"/>
      </div>
      <div className="flex gap-4 mt-2">
        <Legend color="bg-gray-400" text={label1}/>
        <Legend color="bg-blue-500" text={label2}/>
      </div>
    </div>
  );
};

/* ────── 보조 UI ────── */
const Toggle = ({version,changeVersion}:{version:'ai'|'user';changeVersion:(v:any)=>void;})=>(
  <div className="inline-flex bg-slate-800 rounded-lg p-1">
    {(['ai','user'] as const).map(v=>(
      <button key={v} onClick={()=>changeVersion(v)}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          v===version
            ? v==='ai'?'bg-slate-300 text-slate-800':'bg-blue-500 text-white'
            : 'text-slate-300 hover:text-white'
        }`}>
        {v==='ai'?'AI 음성':'내 음성'}
      </button>
    ))}
  </div>
);
const Legend=({color,text}:{color:string;text:string})=>(
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 ${color} rounded`}/>
    <span className="text-sm">{text}</span>
  </div>
);

export default WaveCompare;
