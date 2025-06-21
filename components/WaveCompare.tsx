// components/WaveCompare.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

// DTW 알고리즘 구현
const dtw = (s1: number[], s2: number[]): { distance: number; path: number[][] } => {
  const n = s1.length;
  const m = s2.length;

  // DTW 매트릭스 초기화
  const dtwMatrix = Array(n + 1).fill(null).map(() => Array(m + 1).fill(Infinity));
  dtwMatrix[0][0] = 0;

  // DTW 계산
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.abs(s1[i - 1] - s2[j - 1]);
      dtwMatrix[i][j] = cost + Math.min(
        dtwMatrix[i - 1][j],     // 삽입
        dtwMatrix[i][j - 1],     // 삭제
        dtwMatrix[i - 1][j - 1]  // 매칭
      );
    }
  }

  // 경로 역추적
  const path: number[][] = [];
  let i = n, j = m;
  while (i > 0 && j > 0) {
    path.unshift([i - 1, j - 1]);
    const min = Math.min(dtwMatrix[i - 1][j], dtwMatrix[i][j - 1], dtwMatrix[i - 1][j - 1]);
    if (dtwMatrix[i - 1][j - 1] === min) {
      i--; j--;
    } else if (dtwMatrix[i - 1][j] === min) {
      i--;
    } else {
      j--;
    }
  }

  return { distance: dtwMatrix[n][m], path };
};

interface WaveCompareProps {
  audioFile1?: string;
  audioFile2?: string;
  label1?: string;
  label2?: string;
}

const WaveCompare: React.FC<WaveCompareProps> = ({
  audioFile1 = '/audio/female.wav',
  audioFile2 = '/audio/male.wav',
  label1 = 'Female (정답) - 배경',
  label2 = 'Male (사용자) - DTW 정렬됨'
}) => {
  // S3 URL인 경우 프록시를 통해 접근
  const getProxiedUrl = (url: string) => {
    if (url.startsWith('https://tennyvoice.s3.ap-northeast-2.amazonaws.com/')) {
      return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const proxiedAudioFile1 = getProxiedUrl(audioFile1);
  const proxiedAudioFile2 = getProxiedUrl(audioFile2);
  const waveformRef1 = useRef<HTMLDivElement>(null);
  const waveformRef2 = useRef<HTMLDivElement>(null);

  const wavesurfer1 = useRef<WaveSurfer | null>(null);
  const wavesurfer2 = useRef<WaveSurfer | null>(null);

  const [selectedVersion, setSelectedVersion] = useState<'ai' | 'user'>('ai');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (waveformRef1.current && waveformRef2.current) {
      // 배경 파형 (female.wav) - 뒤에 표시
      wavesurfer1.current = WaveSurfer.create({
        container: waveformRef1.current,
        waveColor: 'rgb(0, 0, 0)',
        progressColor: 'rgba(208, 208, 208, 1)',
        height: 150,
        normalize: true,
        interact: true,
        hideScrollbar: true,
        fillParent: true,
        minPxPerSec: 50,
      });

      // 앞쪽 파형 (male.wav) - 앞에 표시
      wavesurfer2.current = WaveSurfer.create({
        container: waveformRef2.current,
        waveColor: 'rgba(255, 255, 255, 0.5)',
        progressColor: 'rgba(109, 145, 245, 0.97)',
        height: 150,
        normalize: true,
        interact: true,
        hideScrollbar: true,
        fillParent: true,
        minPxPerSec: 50,
      });

      // 두 음성 파일 불러오기 (프록시된 URL 사용)
      wavesurfer1.current.load(proxiedAudioFile1);
      wavesurfer2.current.load(proxiedAudioFile2);

      // DTW를 사용한 파형 정렬
      if (wavesurfer1.current && wavesurfer2.current) {
        wavesurfer1.current.on('ready', () => {
          applyDTWAlignment();
        });

        wavesurfer2.current.on('ready', () => {
          applyDTWAlignment();
        });

        // 재생 상태 추적
        wavesurfer1.current.on('play', () => setIsPlaying(true));
        wavesurfer1.current.on('pause', () => setIsPlaying(false));
        wavesurfer1.current.on('finish', () => setIsPlaying(false));

        wavesurfer2.current.on('play', () => setIsPlaying(true));
        wavesurfer2.current.on('pause', () => setIsPlaying(false));
        wavesurfer2.current.on('finish', () => setIsPlaying(false));
      }

      // DTW 정렬 함수
      const applyDTWAlignment = async () => {
        if (!wavesurfer1.current || !wavesurfer2.current) return;

        try {
          // 두 파형의 길이 가져오기
          const duration1 = wavesurfer1.current.getDuration();
          const duration2 = wavesurfer2.current.getDuration();

          // DTW를 시뮬레이션하기 위해 시간축 조정
          const ratio = duration1 / duration2;

          if (ratio > 1) {
            // female이 더 길면 male을 늘리기
            wavesurfer2.current.setOptions({
              minPxPerSec: 50 * ratio
            });
          } else if (ratio < 1) {
            // male이 더 길면 female을 늘리기
            wavesurfer1.current.setOptions({
              minPxPerSec: 50 / ratio
            });
          }

          // DTW 경로 시뮬레이션 (간단한 선형 매핑)
          const timePoints = 100;
          const path: number[][] = [];

          for (let i = 0; i < timePoints; i++) {
            const t1 = (i / timePoints) * duration1;
            const t2 = (i / timePoints) * duration2;
            path.push([t1, t2]);
          }

        } catch (error) {
          console.error('DTW 정렬 중 오류:', error);
        }
      };
    }

    return () => {
      wavesurfer1.current?.destroy();
      wavesurfer2.current?.destroy();
    };
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      // 현재 재생 중이면 정지
      wavesurfer1.current?.pause();
      wavesurfer2.current?.pause();
    } else {
      // 현재 정지 중이면 선택된 버전 재생
      if (selectedVersion === 'ai') {
        wavesurfer1.current?.play();
      } else {
        wavesurfer2.current?.play();
      }
    }
  };

  const handleVersionChange = (version: 'ai' | 'user') => {
    // 현재 재생 중인 파형을 모두 정지
    wavesurfer1.current?.pause();
    wavesurfer2.current?.pause();

    // 시간을 0초로 리셋
    wavesurfer1.current?.setTime(0);
    wavesurfer2.current?.setTime(0);

    // 버전 변경
    setSelectedVersion(version);
  };

  return (
    <div className="p-4">
      {/* 컨트롤 영역: 토글 버튼과 재생 버튼 */}
      <div className="flex items-center gap-2 mb-4">
        {/* 토글 버튼 */}
        <div className="inline-flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => handleVersionChange('ai')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
              selectedVersion === 'ai'
                ? 'bg-slate-300 text-slate-800'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            AI 음성
          </button>
          <button
            onClick={() => handleVersionChange('user')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
              selectedVersion === 'user'
                ? 'bg-slate-300 text-slate-800'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            내 음성
          </button>
        </div>

        {/* 재생/일시정지 버튼 */}
        <button
          onClick={handlePlayPause}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
        >
          {isPlaying ? '일시정지' : `재생 (${selectedVersion === 'ai' ? 'AI' : '내'})`}
        </button>
      </div>

      <div className="relative border rounded-lg p-2" style={{ height: '150px' }}>
        {/* 배경 파형 */}
        <div
          ref={waveformRef1}
          className="absolute inset-0"
          style={{ zIndex: 1 }}
        ></div>
        {/* 앞쪽 파형 */}
        <div
          ref={waveformRef2}
          className="absolute inset-0"
          style={{ zIndex: 2 }}
        ></div>
      </div>
    </div>
  );
};

export default WaveCompare;