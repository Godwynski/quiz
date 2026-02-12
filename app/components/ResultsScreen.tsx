import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
// Actually, I'll just use div with custom scrollbar class for now to avoid creating another file if I don't have to, but consistency...
// I'll use div for now.

interface ResultsScreenProps {
  score: number;
  total: number;
  answers: {
    question: string;
    selectedAnswer: number;
    correctAnswer: number;
    explanation: string;
    isCorrect: boolean;
  }[];
  onRestart: () => void;
  onRedemption?: () => void;
}

export default function ResultsScreen({ score, total, answers, onRestart, onRedemption }: ResultsScreenProps) {
  const percentage = Math.round((score / total) * 100);
  
  useEffect(() => {
    if (percentage >= 60) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#D4AF37', '#F4C430', '#AA6C39', '#FFFFFF']
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#D4AF37', '#F4C430', '#AA6C39', '#FFFFFF']
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [percentage]);

  let grade = '';
  let colorClass = ''; // Tailwind class for text color

  if (percentage === 100) { grade = 'S'; colorClass = 'text-yellow-400'; }
  else if (percentage >= 80) { grade = 'A'; colorClass = 'text-green-400'; }
  else if (percentage >= 60) { grade = 'B'; colorClass = 'text-blue-400'; }
  else if (percentage >= 40) { grade = 'C'; colorClass = 'text-orange-400'; }
  else { grade = 'F'; colorClass = 'text-red-500'; }

  return (
    <div 
      className="max-w-4xl w-full mx-auto animate-in fade-in zoom-in duration-500"
    >
      <Card className="border-border bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-4xl mb-2">Assessment Complete</CardTitle>
          <CardDescription>
            Performance Summary & Analysis
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="flex flex-col items-center justify-center py-8">
             <div className="relative inline-flex items-center justify-center">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96" cy="96" r="88"
                  stroke="currentColor" strokeWidth="12"
                  fill="transparent"
                  className="text-secondary"
                />
                <circle
                  cx="96" cy="96" r="88"
                  stroke="currentColor" strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={2 * Math.PI * 88 * (1 - percentage / 100)}
                  strokeLinecap="round"
                  className={`${colorClass} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className={`text-6xl font-black ${colorClass}`}>{grade}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Grade</div>
              </div>
            </div>
            
            <div className="mt-6 text-2xl font-medium">
              Score: <span className={colorClass}>{score}</span> <span className="text-muted-foreground">/ {total}</span>
            </div>
          </div>

          <div className="grid gap-4">
             <h3 className="text-lg font-semibold flex items-center gap-2">
                Question Analysis
             </h3>
             <div className="space-y-4 pr-2">
                {answers.map((answer, index) => (
                  <Card key={index} className={`border ${answer.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <CardHeader className="p-4 pb-2">
                       <div className="flex justify-between items-start">
                          <span className="text-xs font-bold uppercase text-muted-foreground">Question {index + 1}</span>
                          {answer.isCorrect ? (
                            <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Correct</span>
                          ) : (
                             <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Incorrect</span>
                          )}
                       </div>
                       <CardTitle className="text-base font-medium leading-normal pt-1">{answer.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm space-y-2">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div className={answer.isCorrect ? "text-green-500 font-medium" : "text-red-400 line-through opacity-70"}>
                             Selected: {String.fromCharCode(65 + answer.selectedAnswer)}
                          </div>
                          {!answer.isCorrect && (
                             <div className="text-green-500 font-medium">
                                Correct: {String.fromCharCode(65 + answer.correctAnswer)}
                             </div>
                          )}
                       </div>
                       
                       {answer.explanation && (
                          <div className="mt-3 bg-background/50 p-3 rounded-md border border-border">
                             <span className="text-xs font-bold text-primary uppercase block mb-1">Insight</span>
                             <p className="text-muted-foreground">{answer.explanation}</p>
                          </div>
                       )}
                    </CardContent>
                  </Card>
                ))}
             </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pb-8 px-8">
           {score < total && onRedemption && (
             <Button onClick={onRedemption} size="lg" variant="default" className="w-full sm:w-auto px-8 py-6 text-lg bg-red-600 hover:bg-red-700 text-white">
                Try Redemption Mode
             </Button>
           )}
           <Button onClick={onRestart} size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg border-zinc-200">
              Return to Dashboard
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
