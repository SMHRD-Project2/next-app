'use client';

import { useState } from 'react';

interface TTSProps {
  text: string;
  voice?: string;
  onError?: (error: Error) => void;
}

export const TTS = ({ text, voice = 'SPK005.wav', onError }: TTSProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleTTS = async () => {
    try {
      setIsLoading(true);
      
      // 음성 파일 가져오기
      const voiceResponse = await fetch(`audio/${voice}`);
      const voiceBlob = await voiceResponse.blob();

      // FormData 생성
      const formData = new FormData();
      formData.append('text', text);
      formData.append('voice_file', voiceBlob, voice);

      // FastAPI 서버로 요청
      const response = await fetch(`http://localhost:8000/tts?text=${encodeURIComponent(text)}`, {
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

    } catch (error) {
      console.error('TTS 오류:', error);
      onError?.(error as Error);
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
      
      {audioUrl && (
        <div className="mt-4">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}; 