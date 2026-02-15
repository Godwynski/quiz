import { Button } from "@/app/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Question } from "@/app/data/quizzes";

interface QuestionListProps {
  questions: Question[]; // Using the Question type from data/quizzes (needs to match structure)
  currentStep: number;
  setCurrentStep: (index: number) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (index: number) => void;
}

export function QuestionList({ 
  questions, 
  currentStep, 
  setCurrentStep, 
  onAddQuestion, 
  onRemoveQuestion 
}: QuestionListProps) {
  return (
    <div className="hidden md:block space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-sm font-medium text-muted-foreground">Questions</span>
        <Button variant="ghost" size="sm" onClick={onAddQuestion}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
        {questions.map((q, i) => (
          <div 
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`p-3 rounded-lg border text-sm cursor-pointer transition-all ${
              currentStep === i 
              ? 'bg-primary text-primary-foreground border-primary shadow-md' 
              : 'bg-card border-border'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium truncate max-w-[150px]">
                {q.question || `Question ${i + 1}`}
              </span>
              {questions.length > 1 && (
                <Trash2 
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemoveQuestion(i); }} 
                  className="w-4 h-4 opacity-50 hover:opacity-100 hover:text-destructive" 
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
