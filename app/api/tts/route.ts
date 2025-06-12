import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const voiceFile = formData.get('voice_file') as File;
    const silenceFile = formData.get('silence_file') as File;

    if (!text || !voiceFile || !silenceFile) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // FastAPI 서버로 요청 전송
    const apiUrl = 'http://localhost:8000/tts';
    const apiFormData = new FormData();
    apiFormData.append('text', text);
    apiFormData.append('voice_file', voiceFile);
    apiFormData.append('silence_file', silenceFile);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `TTS 서버 오류: ${error}` },
        { status: response.status }
      );
    }

    // 오디오 데이터를 그대로 반환
    const audioData = await response.arrayBuffer();
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/wav',
      },
    });
  } catch (error) {
    console.error('TTS 처리 중 오류:', error);
    return NextResponse.json(
      { error: 'TTS 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
