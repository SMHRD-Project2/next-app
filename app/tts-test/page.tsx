'use client';

import { useState } from 'react';
import TTSComponent from '@/components/TTSComponent';

export default function TTSTest() {
  const [text, setText] = useState('안녕하세요, TTS 테스트입니다.');

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
        {/* <TTSComponent text={text} voice="SPK005.wav" /> */}
        <TTSComponent text={text} voice="SPK080.wav" />
      </div>
    </div>
  );
}
