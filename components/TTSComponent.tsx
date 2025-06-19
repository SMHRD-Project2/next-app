'use client';

import { useState } from 'react';

interface TTSComponentProps {
  text: string;
  voice: string;
}

export default function TTSComponent({ 
  text,
  voice
}: TTSComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleTTS = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 음성 파일 로드
      const voiceResponse = await fetch(`audio/${voice}`);
      const voiceBlob = await voiceResponse.blob();
      
      // 무음 파일 로드 (고정된 파일 사용)
      const silenceResponse = await fetch('audio/silence_100ms.wav');
      const silenceBlob = await silenceResponse.blob();
      
      const formData = new FormData();
      formData.append('voice_file', voiceBlob, voice);
      formData.append('silence_file', silenceBlob, 'silence_100ms.wav');

      const response = await fetch(`${process.env.NEXT_PUBLIC_PY_URL }/tts?text=${encodeURIComponent(text)}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('TTS 변환 실패');
      }

      // 오디오 데이터를 Blob으로 변환
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleTTS}
        disabled={isLoading}
        className={`px-4 py-2 rounded text-white ${
          isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isLoading ? '변환 중...' : '음성으로 들려주기'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="mt-4">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
} 