"use client";

import { useState, useEffect } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Quiz, Question } from "@/app/data/quizzes";
import confetti from "canvas-confetti";
import ResultsScreen from "./ResultsScreen";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";

import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { quizService } from "../services/quizService";

interface QuizRunnerProps {
  quiz: Quiz;
  user: User | null;
  onExit: () => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const shuffleQuestion = (q: Question): Question => {
  const optionsWithOriginalIndex = q.options.map((opt, idx) => ({ opt, originalIndex: idx }));
  
  // Fisher-Yates shuffle
  for (let i = optionsWithOriginalIndex.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [optionsWithOriginalIndex[i], optionsWithOriginalIndex[j]] = [optionsWithOriginalIndex[j], optionsWithOriginalIndex[i]];
  }

  const shuffledOptions = optionsWithOriginalIndex.map(item => item.opt);
  const newCorrectAnswer = optionsWithOriginalIndex.findIndex(item => item.originalIndex === q.correctAnswer);

  return {
    ...q,
    options: shuffledOptions,
    correctAnswer: newCorrectAnswer
  };
};

export default function QuizRunner({ quiz, user, onExit }: QuizRunnerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState(() => 
    shuffleArray(quiz.questions.map(q => shuffleQuestion(q)))
  );
  const [userAnswers, setUserAnswers] = useState<{
    question: string;
    selectedAnswer: number;
    correctAnswer: number;
    explanation: string;
    isCorrect: boolean;
  }[]>([]);
  
  // Gamification State
  const [xpGained, setXpGained] = useState<number | undefined>(undefined);
  const [newLeague, setNewLeague] = useState<string | undefined>(undefined);

  const currentQuestion = activeQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;

  useEffect(() => {
    if (quizComplete && score === activeQuestions.length) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#18181b', '#d4d4d8'] // Monochrome confetti
      });
    }
  }, [quizComplete, score, activeQuestions.length]);

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswerIndex(index);
    setIsAnswered(true);

    if (index === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }

    setUserAnswers([
      ...userAnswers,
      {
        question: currentQuestion.question,
        selectedAnswer: index,
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation,
        isCorrect: index === currentQuestion.correctAnswer
      }
    ]);

    setShowExplanation(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswerIndex(null);
      setIsAnswered(false);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
      
      // Save results if logged in
      if (user) {
         try {
            console.log("Submitting attempt...", {
               quizId: quiz.id,
               title: quiz.title,
               score,
               total: activeQuestions.length,
               answersCount: userAnswers.length
            });

            const result = await quizService.submitAttempt(
               quiz.id,
               quiz.title,
               score,
               activeQuestions.length,
               userAnswers
            );
            
            if (result) {
               setXpGained(result.xp_gained);
               setNewLeague(result.new_league);
            }

            toast.success("Result saved!");
         } catch (err: unknown) {
            console.error("Failed to save result. Full error:", err);
            const error = err as Error; 
            console.error("Error details:", {
                message: error?.message,
                code: (error as { code?: string })?.code,
                details: (error as { details?: string })?.details,
                hint: (error as { hint?: string })?.hint
            });
            toast.error("Failed to save result history: " + (error?.message || "Unknown error"));
         }
      }
    }
  };

  const handleRedemption = () => {
    const incorrectQuestions = quiz.questions.filter((_, idx) => {
        // Find if this question index (relative to original quiz) was answered incorrectly
        const originalQuestion = quiz.questions[idx];
        const answer = userAnswers.find(a => a.question === originalQuestion.question);
        return answer && !answer.isCorrect;
    });

    if (incorrectQuestions.length > 0) {
        setActiveQuestions(shuffleArray(incorrectQuestions.map(q => shuffleQuestion(q))));
        setCurrentQuestionIndex(0);
        setSelectedAnswerIndex(null);
        setIsAnswered(false);
        setScore(0);
        setShowExplanation(false);
        setQuizComplete(false);
        setUserAnswers([]);
    }
  };

  const handleExit = () => {
     if (!quizComplete) {
        setShowExitConfirm(true);
        return;
     }
     onExit();
  };

  if (quizComplete) {
    return (
      <ResultsScreen 
        score={score}
        total={activeQuestions.length}
        answers={userAnswers}
        onRestart={onExit}
        onRedemption={handleRedemption}
        xpGained={xpGained}
        newLeague={newLeague}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 md:px-0 pb-20">
      {/* Header / Breadcrumb */}
      <div className="mb-6 pt-4 flex items-center justify-between">
         <Button 
            variant="ghost" 
            className="text-zinc-500 hover:text-zinc-900 pl-0 hover:bg-transparent"
            onClick={handleExit}
         >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back
         </Button>
         
         <div className="flex items-center gap-4 text-sm font-medium text-zinc-500">
            <span>{currentQuestionIndex + 1} / {activeQuestions.length}</span>
            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden border border-zinc-200">
               <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
               />
            </div>
         </div>
      </div>

      <div className="mt-2">
        <div key={currentQuestionIndex} className="animate-in fade-in slide-in-from-right-4 duration-300">
          <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
             <CardHeader className="pb-2">
                <CardTitle className="text-xl md:text-2xl leading-tight">
                   {currentQuestion.question}
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 pt-4">
                <div className="space-y-3">
                   {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedAnswerIndex === index;
                      const isCorrect = index === currentQuestion.correctAnswer;
                      const showCorrectness = isAnswered && isCorrect;
                      const showIncorrectness = isAnswered && isSelected && !isCorrect;

                      let buttonClass = "bg-card hover:bg-zinc-50 border-input text-card-foreground hover:scale-[1.01] hover:rotate-1"; // Default
                      
                      if (showCorrectness) {
                         buttonClass = "bg-green-100 border-green-500 text-green-900 shadow-[0_0_0_1px_rgba(34,197,94,1)] scale-[1.01] rotate-0";
                      } else if (showIncorrectness) {
                         buttonClass = "bg-red-50 border-red-400 text-red-900 opacity-80 rotate-0";
                      } else if (isSelected) {
                         buttonClass = "bg-primary/10 border-primary text-primary-foreground font-medium rotate-0";
                      }

                      return (
                         <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={isAnswered}
                            className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 flex items-center justify-between group doodle-action ${buttonClass}`}
                         >
                            <span className="font-medium text-lg leading-snug">{option}</span>
                            {showCorrectness && <Check className="w-6 h-6 text-green-700 stroke-[3]" />}
                            {showIncorrectness && <X className="w-6 h-6 text-red-600 stroke-[3]" />}
                         </button>
                      );
                   })}
                </div>

                {showExplanation && (
                    <div className="mt-6 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30 text-sm md:text-base text-muted-foreground leading-relaxed">
                         <span className="font-bold block mb-1 text-foreground flex items-center gap-2">
                            💡 Explanation
                         </span>
                         {currentQuestion.explanation}
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                         <Button 
                            onClick={handleNextQuestion} 
                            size="lg"
                            className="w-full md:w-auto rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                         >
                            {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Assessment'} 
                            <ArrowRight className="ml-2 w-5 h-5" />
                         </Button>
                      </div>
                   </div>
                )}
             </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={onExit}
        title="Quit Assessment?"
        description="Are you sure you want to leave? Your current progress in this assessment will be lost."
        confirmText="Yes, Quit"
        cancelText="Stay"
        variant="destructive"
      />
    </div>
  );
}
