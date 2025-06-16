import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, Calendar } from "lucide-react"
import { useEffect } from "react"

export function TrainingHistoryList() {
  // 클라이언트 측에서 컴포넌트가 마운트될 때 실행되는 코드
  useEffect(() => {
    console.log('TrainingHistoryList 컴포넌트가 클라이언트에서 마운트되었습니다.');
  }, []);

  const historyData = [
    {
      id: 1,
      date: "2024-01-07",
      category: "뉴스 읽기",
      sentence: "오늘 서울 지역에 첫눈이 내렸습니다.",
      scores: { pronunciation: 91, intonation: 88, tone: 92 },
      // status: "완료",
    },
    {
      id: 2,
      date: "2024-01-07",
      category: "긴 문장",
      sentence: "정부는 새로운 경제 정책을 발표하며...",
      scores: { pronunciation: 85, intonation: 82, tone: 89 },
      // status: "완료",
    },
    {
      id: 3,
      date: "2024-01-06",
      category: "짧은 문장",
      sentence: "안녕하세요, 시청자 여러분.",
      scores: { pronunciation: 88, intonation: 85, tone: 86 },
      // status: "완료",
    },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-onair-mint"
    if (score >= 80) return "text-onair-orange"
    return "text-red-400"
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "뉴스 읽기":
        return "bg-onair-mint/10 text-onair-mint"
      case "긴 문장":
        return "bg-onair-orange/10 text-onair-orange"
      case "짧은 문장":
        return "bg-onair-blue/10 text-onair-blue"
      default:
        return "bg-onair-text-sub/10 text-onair-text-sub"
    }
  }

  // 음성 파일 재생 함수
  const playAudioFile = () => {
    console.log('playAudioFile 함수 호출됨'); // 함수 호출 시작 로그
    try {
      const audio = new Audio('/audio/female.wav'); // public 폴더의 audio 파일 경로
      console.log('Audio 객체 생성 시도: /audio/female.wav');

      // 오디오 로드 및 재생 관련 이벤트 리스너 추가 (디버깅용)
      audio.onplay = () => {
        console.log('오디오 재생 시작됨');
      };
      audio.onended = () => {
        console.log('오디오 재생 완료됨');
      };
      audio.onerror = (e) => {
        console.error('오디오 로드 또는 재생 중 에러 발생:', e); // 에러 로그
      };

      // 오디오 재생 시도
      audio.play().catch(error => {
        console.error('audio.play() Promise 에러:', error); // Promise 에러 캐치
      });
    } catch (error) {
      console.error('playAudioFile 함수 내부에서 예상치 못한 에러 발생:', error); // 일반 에러 캐치
    }
  };

  return (
    <Card className="bg-onair-bg-sub border-onair-text-sub/20">
      <CardHeader>
        <CardTitle className="text-onair-text flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          훈련 기록
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {historyData.map((item) => (
          <div key={item.id} className="p-4 bg-onair-bg rounded-lg border border-onair-text-sub/10 space-y-3">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
                <span className="text-onair-text-sub text-sm">{item.date}</span>
              </div>
              {/* <Badge variant="outline" className="border-onair-mint text-onair-mint">
                {item.status}
              </Badge> */}
            </div>

            {/* 문장 */}
            <p className="text-onair-text">{item.sentence}</p>

            {/* 점수 */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-onair-text-sub text-xs">발음</p>
                <p className={`font-semibold ${getScoreColor(item.scores.pronunciation)}`}>
                  {item.scores.pronunciation}
                </p>
              </div>
              <div className="text-center">
                <p className="text-onair-text-sub text-xs">억양</p>
                <p className={`font-semibold ${getScoreColor(item.scores.intonation)}`}>{item.scores.intonation}</p>
              </div>
              <div className="text-center">
                <p className="text-onair-text-sub text-xs">톤</p>
                <p className={`font-semibold ${getScoreColor(item.scores.tone)}`}>{item.scores.tone}</p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-onair-text-sub/20 text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
                onClick={() => {
                  console.log('"음성 재생" 버튼 클릭 이벤트 발생!');
                  playAudioFile();
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                음성 재생
              </Button>
              <Button size="sm" className="bg-onair-mint text-onair-bg hover:bg-onair-mint/90">
                <RotateCcw className="w-4 h-4 mr-2" />
                다시 훈련
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
