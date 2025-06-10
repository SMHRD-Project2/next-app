"use client";

export default function Zonoss() {
    const Zonos = async () => {
        console.log("클릭")
        const res = await fetch("/api/tts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log("클릭res", res)
        
    const data = await res.json();

    if (!data.url) {
      alert("TTS 실패");
      return;
    }

    // 재생
    const audio = new Audio(data.url);
    audio.play();

    // 다운로드도 하고 싶으면 주석 해제  ////// 근디 안댐
    // const a = document.createElement('a');
    // a.href = data.url;
    // a.download = 'output.wav';
    // a.click();
  };

  return (
    <button onClick={Zonos}>하이하이</button>
  );
}
