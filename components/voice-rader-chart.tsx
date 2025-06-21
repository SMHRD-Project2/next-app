import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

const categories = [
  '발음 특성',
  '음높이',
  '강세',
  '발화 속도',
  '모음 발음',
  '억양',
  '리듬',
  '쉼표',
];

interface AIAnalysisItem {
  metric: string;
  score: number;
  shortFeedback: string;
  detailedFeedback: string[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-onair-bg-sub rounded-lg border border-onair-text-sub/20 w-64 text-onair-text shadow-lg">
        <p className="font-bold text-base mb-2 text-onair-mint">{data.category}</p>
        <p className="font-semibold text-sm mb-2">{data.item.shortFeedback}</p>
        <div className="text-xs text-onair-text-sub space-y-1 border-t border-onair-text-sub/10 pt-2">
          {data.item.detailedFeedback.map((detail: string, index: number) => (
            <p key={index}>- {detail}</p>
          ))}
        </div>
        <p className="text-right font-bold mt-2 text-onair-mint">{`${data.score.toFixed(1)}점`}</p>
      </div>
    );
  }
  return null;
};


export default function VoiceRadarChart({ scores, items }: { scores: number[]; items: AIAnalysisItem[] }) {
  const isMobile = useIsMobile();
  const data = categories.map((category, i) => ({
    category,
    score: scores[i] ?? 0,
    item: items[i],
  }));

  if (isMobile) {
    return (
      <div className="w-full h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#e0e0e0" strokeOpacity={0.3}  />
            <PolarAngleAxis
              dataKey="category"
              tickSize={12}
              tick={{ fontSize: 12, fontWeight: 'bold' }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#A0A0A0' }} />
            <Radar name="점수" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(136, 132, 216, 0.5)', strokeWidth: 2 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      minHeight: 500,
    }}>
      <RadarChart width={800} height={800} data={data}>
        <PolarGrid stroke="#e0e0e0" strokeOpacity={0.3}  />
        <PolarAngleAxis 
          dataKey="category"
          tickSize={20} // 라벨을 차트에서 멀리 떨어뜨림
          tick={{
            fontSize: 17,
            fontWeight: 'bold',
            dy : 3
          }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 13, fill: '#A0A0A0' }}  />
        <Radar name="점수" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(136, 132, 216, 0.5)', strokeWidth: 2 }} />
      </RadarChart>
    </div>
  );
}