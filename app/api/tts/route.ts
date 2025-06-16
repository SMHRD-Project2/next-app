import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const text = request.nextUrl.searchParams.get('text');
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
    apiFormData.append('voice_file', voiceFile);
    apiFormData.append('silence_file', silenceFile);

    const response = await fetch(`${apiUrl}?text=${encodeURIComponent(text)}`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('FastAPI 서버 응답:', error);
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const voice = searchParams.get('voice');

    if (!text || !voice) {
      return NextResponse.json(
        { error: 'text와 voice 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // FastAPI 서버 URL
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
    
    console.log('FastAPI 요청:', {
      url: `${fastApiUrl}/tts`,
      text,
      voice
    });

    // FastAPI로 요청 보내기
    const response = await fetch(`${fastApiUrl}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('FastAPI 서버 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`FastAPI 서버 응답 오류: ${response.status} ${response.statusText}`);
    }

    // 오디오 데이터를 base64로 받기
    const audioData = await response.json();
    
    if (!audioData.audio) {
      console.error('FastAPI 응답에 audio 데이터가 없습니다:', audioData);
      throw new Error('FastAPI 응답에 audio 데이터가 없습니다');
    }

    // base64를 Blob으로 변환
    const audioBlob = Buffer.from(audioData.audio, 'base64');
    
    // Blob을 URL로 변환
    const audioUrl = URL.createObjectURL(new Blob([audioBlob], { type: 'audio/wav' }));

    return NextResponse.json({ audioUrl });

  } catch (error) {
    console.error('TTS 처리 중 오류:', error);
    return NextResponse.json(
      { 
        error: 'TTS 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
