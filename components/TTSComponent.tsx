'use client';

import { useState, useRef } from 'react';

interface TTSComponentProps {
  defaultVoiceFile?: string;
  defaultSilenceFile?: string;
}

export default function TTSComponent({ 
  defaultVoiceFile = '/default_voice.wav',
  defaultSilenceFile = '/silence_100ms.wav'
}: TTSComponentProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('text', text);
      
      // 음성 파일 로드
      const voiceResponse = await fetch(defaultVoiceFile);
      const voiceBlob = await voiceResponse.blob();
      formData.append('voice_file', voiceBlob, 'voice.wav');
      
      // 무음 파일 로드
      const silenceResponse = await fetch(defaultSilenceFile);
      const silenceBlob = await silenceResponse.blob();
      formData.append('silence_file', silenceBlob, 'silence.wav');

      const response = await fetch('/api/tts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'TTS 변환 중 오류가 발생했습니다.');
      }

      // 오디오 데이터를 Blob으로 변환
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // 오디오 재생
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700">
            변환할 텍스트
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={4}
            placeholder="텍스트를 입력하세요..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !text}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${isLoading || !text 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
        >
          {isLoading ? '변환 중...' : 'TTS 변환'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <audio ref={audioRef} controls className="mt-4 w-full" />
    </div>
  );
} 