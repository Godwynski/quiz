"use client";

import { useState, useEffect } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Quiz, Question } from "../data/quizzes";
import confetti from "canvas-confetti";
import ResultsScreen from "./ResultsScreen";
import { ConfirmDialog } from "./ui/confirm-dialog";

interface QuizRunnerProps {
  quiz: Quiz;
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

export default function QuizRunner({ quiz, onExit }: QuizRunnerProps) {
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

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswerIndex(null);
      setIsAnswered(false);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
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
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 md:px-0 pb-20">
      {/* Header / Breadcrumb */}
      <div className="mb-8 pt-4">
         <Button 
            variant="ghost" 
            className="text-zinc-500 hover:text-zinc-900 pl-0 mb-4 hover:bg-transparent"
            onClick={handleExit}
         >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Dashboard
         </Button>
         
         <div className="flex items-center justify-between text-sm font-medium text-zinc-500">
            <span>Question {currentQuestionIndex + 1} of {activeQuestions.length}</span>
            <div className="h-1.5 w-32 bg-zinc-100 rounded-full overflow-hidden">
               <div
                  className="h-full bg-zinc-900 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
               />
            </div>
         </div>
      </div>

      <div className="mt-8">
        <div key={currentQuestionIndex} className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-8">
             <h2 className="text-2xl md:text-3xl font-semibold text-zinc-900 leading-tight">
                {currentQuestion.question}
             </h2>
             
             <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                   const isSelected = selectedAnswerIndex === index;
                   const isCorrect = index === currentQuestion.correctAnswer;
                   const showCorrectness = isAnswered && isCorrect;
                   const showIncorrectness = isAnswered && isSelected && !isCorrect;

                   let buttonClass = "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700"; // Default
                   
                   if (showCorrectness) {
                      buttonClass = "bg-green-50 border-green-200 text-green-700";
                   } else if (showIncorrectness) {
                      buttonClass = "bg-red-50 border-red-200 text-red-700";
                   } else if (isSelected) {
                      buttonClass = "bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800";
                   }

                   return (
                      <button
                         key={index}
                         onClick={() => handleAnswerSelect(index)}
                         disabled={isAnswered}
                         className={`w-full p-4 text-left rounded-xl border transition-all duration-200 flex items-center justify-between group ${buttonClass}`}
                      >
                         <span className="font-medium">{option}</span>
                         {showCorrectness && <Check className="w-5 h-5 text-green-600" />}
                         {showIncorrectness && <X className="w-5 h-5 text-red-600" />}
                      </button>
                   );
                })}
             </div>

              {showExplanation && (
                    <div className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-sm md:text-base text-zinc-600 leading-relaxed">
                         <span className="font-semibold block mb-1 text-zinc-900">Explanation</span>
                         {currentQuestion.explanation}
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                         <Button 
                            onClick={handleNextQuestion} 
                            className="bg-zinc-900 text-white hover:bg-zinc-800 h-11 px-8 rounded-full font-medium"
                         >
                            {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Assessment'} 
                            <ArrowRight className="ml-2 w-4 h-4" />
                         </Button>
                      </div>
                   </div>
                )}
          </div>
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
