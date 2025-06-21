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
        waveColor: 'rgba(224, 224, 224, 1)',
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
        waveColor: 'rgba(74, 144, 226, 0.5)',
        progressColor: 'rgba(0, 51, 102, 0.5)',
        height: 150,
        normalize: true,
        interact: true,
        hideScrollbar: true,
        fillParent: true,
        minPxPerSec: 50,
      });
      
      // 두 음성 파일 불러오기 (프록시된 URL 사용)
      wavesurfer1.current.load(proxiedAudioFile1)
      wavesurfer2.current.load(proxiedAudioFile2)

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
  }, [proxiedAudioFile1, proxiedAudioFile2]);

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

      {/* 라디오 버튼 */}
      <div className="mb-4">
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="version"
              value="ai"
              checked={selectedVersion === 'ai'}
              onChange={() => handleVersionChange('ai')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">AI 음성</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="version"
              value="user"
              checked={selectedVersion === 'user'}
              onChange={() => handleVersionChange('user')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">내 음성</span>
          </label>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-sm">{label1}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">{label2}</span>
          </div>
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
      
      <button 
        onClick={handlePlayPause}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {isPlaying ? '일시정지' : '재생'} ({selectedVersion === 'ai' ? 'AI 음성' : '내 음성'})
      </button>
    </div>
  );
};

export default WaveCompare;