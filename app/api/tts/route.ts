import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log("TTS API 요청 시작");
    
    const sessionHash = "7w42yzzyg0q"; // 세션 해시 고정값
    const TTS_URL = process.env.TTS_URL;
    
    if (!TTS_URL) {
      throw new Error('TTS_URL 환경 변수가 설정되지 않았습니다.');
    }
    
    // 1. TTS 요청 보내기
    const response = await fetch(`${TTS_URL}/gradio_api/queue/join?`, {
      headers: {
        "accept": "*/*",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "Referer": `${TTS_URL}/?`,
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: JSON.stringify({
        data: [
          "Zyphra/Zonos-v0.1-transformer",  // 모델 이름
          "안녕하세요",                  // 변환할 텍스트
          "ko",                            // 언어
          // "C:/Users/smhrd/Desktop/SPK080KBSCU083M001.wav",       // 참조 오디오
          null,                                                     // 참조 오디오
          {
            "path": "/tmp/gradio/51b7d61371426b93866dd4ee547debe8f44b3ca128092cf27d697006f4db9c7f/silence_100ms.wav",
            "url": `${TTS_URL}/gradio_api/file=/tmp/gradio/51b7d61371426b93866dd4ee547debe8f44b3ca128092cf27d697006f4db9c7f/silence_100ms.wav`,
            "size": null,
            "orig_name": "silence_100ms.wav",
            "mime_type": null,
            "is_stream": false,
            "meta": {
              "_type": "gradio.FileData"
            }
          },
          0.2,                               // speed
          0.5, 0.05, 0.05, 0.05, 0.05,   // emotion sliders
          0.1, 0.8,                        // emotion sliders
          0.78,                            // VQ Score
          24000,                           // Fmax (Hz)
          45,                              // Pitch Std
          18.5,                              // Speaking Rate
          4,                               // DNSMOS Overall
          false,                           // Speaker Noised
          2,                               // CFG Scale
          0,                               // Top P
          0,                               // Min K
          0,                               // Min P
          0.5,                             // Linear
          0.4,                             // Confidence
          0,                               // Quadratic
          1367318334,                      // Seed
          true,                            // Randomize Seed
          ["emotion"]                      // Unconditional Keys
        ],
        event_data: null,
        fn_index: 2,
        trigger_id: 60,
        session_hash: sessionHash
      }),
      method: "POST"
    });

    console.log("TTS API 응답 상태:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      // console.error("TTS API 에러:", errorText);
      return NextResponse.json({ error: `TTS API 에러: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    console.log("TTS API 응답 데이터:", data);

    // 2. 결과 폴링
    let wavUrl = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));

      try {
        const pollRes = await fetch(`${TTS_URL}/gradio_api/queue/data?session_hash=${sessionHash}`, {
          headers: {
            "accept": "text/event-stream",
            "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json",
            "Referer": `${TTS_URL}/?`,
            "Referrer-Policy": "strict-origin-when-cross-origin"
          },
          method: "GET"
        });
        console.log(`폴링:`, pollRes);

        if (!pollRes.ok) {
          // console.warn(`폴링 시도 ${i + 1}/10 실패: ${pollRes.status}`);
          continue;
        }

        const text = await pollRes.text();
        console.log(`text 텍스트:`, text);

        // SSE 응답 파싱
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // 'data: ' 제거
              const pollData = JSON.parse(jsonStr);
              // console.log(`폴링 시도 ${i + 1}/10 파싱된 데이터:`, pollData);

              wavUrl = pollData?.output?.data?.[0]?.url;
              if (wavUrl) {
                // console.log("WAV URL 찾음:", wavUrl);
                break;
              }
            } catch (e) {
              // console.warn(`폴링 시도 ${i + 1}/10 JSON 파싱 실패:`, e);
            }
          }
        }

        if (wavUrl) break;
      } catch (error) {
        // console.warn(`폴링 시도 ${i + 1}/10 중 에러:`, error);
      }
    }

    if (!wavUrl) {
      // console.error("폴링 타임아웃: wav URL을 받지 못함");
      return NextResponse.json({ error: "wav URL을 받지 못했습니다." }, { status: 504 });
    }

    return NextResponse.json({ url: wavUrl });
  } catch (error) {
    // console.error('TTS 에러:', error);
    return NextResponse.json({ error: 'TTS 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
