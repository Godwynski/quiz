import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";

interface QuestionEditorProps {
  question: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  index: number;
  totalQuestions: number;
  onQuestionChange: (value: string) => void;
  onOptionChange: (oIndex: number, value: string) => void;
  onCorrectAnswerChange: (oIndex: number) => void;
  onExplanationChange: (value: string) => void;
  onRemove: () => void;
  onAdd: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function QuestionEditor({
  question,
  index,
  totalQuestions,
  onQuestionChange,
  onOptionChange,
  onCorrectAnswerChange,
  onExplanationChange,
  onRemove,
  onAdd,
  onNext,
  onPrev
}: QuestionEditorProps) {
  return (
    <div
      className="animate-in fade-in duration-300"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
          <div className="flex gap-2 md:hidden">
            <Button size="icon" variant="outline" disabled={index === 0} onClick={onPrev}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="flex items-center text-sm text-muted-foreground">
              {index + 1} / {totalQuestions}
            </span>
            <Button size="icon" variant="outline" disabled={index === totalQuestions - 1} onClick={onNext}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label>Question Text</Label>
            <Input 
              value={question.question}
              onChange={(e) => onQuestionChange(e.target.value)}
              placeholder="What is the capital of France?"
              className="text-lg font-medium" 
            />
          </div>

          <div className="space-y-4">
            <Label>Answers (Select the correct one)</Label>
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <div 
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all ${
                      question.correctAnswer === oIndex
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-muted-foreground/30 hover:border-primary'
                    }`}
                    onClick={() => onCorrectAnswerChange(oIndex)}
                  >
                    {question.correctAnswer === oIndex && <Check className="w-3 h-3" />}
                  </div>
                  <Input 
                    value={option}
                    onChange={(e) => onOptionChange(oIndex, e.target.value)}
                    placeholder={`Option ${oIndex + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <Label>Explanation (Optional)</Label>
            <Textarea 
              value={question.explanation}
              onChange={(e) => onExplanationChange(e.target.value)}
              placeholder="Explain why the answer is correct..."
              className="resize-none h-20"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between bg-muted/20 py-4">
          <Button 
            variant="outline" 
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
            disabled={totalQuestions <= 1}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Question
          </Button>
          
          {/* Mobile Add Button */}
          <Button onClick={onAdd} variant="secondary" className="md:hidden">
            <Plus className="w-4 h-4 mr-2" /> Add New
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
