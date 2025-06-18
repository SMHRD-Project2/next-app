import WaveCompare from '@/components/WaveCompare';

export default function HomePage() {
  return (
    <main>
      <WaveCompare 
        audioFile1="https://tennyvoice.s3.ap-northeast-2.amazonaws.com/model/psh.wav"
        audioFile2="https://tennyvoice.s3.ap-northeast-2.amazonaws.com/model/kjh.wav"
      />
    </main>
  );
}