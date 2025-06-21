// components/VoiceRadarChart.tsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';

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

export default function VoiceRadarChart({ scores }: { scores: number[] }) {
  const data = categories.map((category, i) => ({
    category,
    score: scores[i] ?? 0,
  }));

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      minHeight: 500,
    }}>
      <RadarChart width={450} height={450} data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="category" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar name="점수" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
        <Tooltip />
      </RadarChart>
    </div>
  );
}