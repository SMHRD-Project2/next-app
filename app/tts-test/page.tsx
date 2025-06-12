'use client';

import { useState, useRef } from 'react';

export default function TTSTest() {
  const [text, setText] = useState('안녕하세요, TTS 테스트입니다.');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleTTS = async () => {
    try {
      setIsLoading(true);
      
      // 음성 파일과 무음 파일을 가져옵니다
      const voiceResponse = await fetch('audio/SPK005.wav');
      const silenceResponse = await fetch('audio/silence_100ms.wav');
      
      const voiceBlob = await voiceResponse.blob();
      const silenceBlob = await silenceResponse.blob();

      // FormData 생성
      const formData = new FormData();
      formData.append('text', text);
      formData.append('voice_file', voiceBlob, 'SPK080.wav');
      formData.append('silence_file', silenceBlob, 'silence_100ms.wav');

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
      alert('TTS 변환 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">TTS 테스트</h1>
      <div className="space-y-4">
        <textarea
          className="w-full p-2 border rounded"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
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
            <audio ref={audioRef} controls src={audioUrl} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
