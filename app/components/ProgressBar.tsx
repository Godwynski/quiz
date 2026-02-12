

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = (current / total) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2 font-serif uppercase tracking-widest">
        <span>Question {current}</span>
        <span>{total} Total</span>
      </div>
      <div className="h-2 bg-secondary/30 rounded-full overflow-hidden border border-white/5">
      <div
           // I can't use motion.div here without importing it. I'll stick to div with transition class for simplicity as Framer Motion is heavy just for this.
           // Actually I'll use simple div with style and transition class.
           className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(234,179,8,0.5)]"
           style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
