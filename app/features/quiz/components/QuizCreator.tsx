"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Quiz } from "@/app/data/quizzes";
import { useAuth } from "@/app/components/auth-provider";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { toast } from "sonner";
import { QuizSchema } from "@/app/lib/schemas";
import { quizService } from "../services/quizService";
import { z } from "zod";

import { QuizMetadataForm } from "./quiz-creator/QuizMetadataForm";
import { QuestionList } from "./quiz-creator/QuestionList";
import { QuestionEditor } from "./quiz-creator/QuestionEditor";
import { QuizImportView } from "./quiz-creator/QuizImportView";

interface QuizCreatorProps {
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
  initialData?: Quiz;
}

export default function QuizCreator({ onSave, onCancel, initialData }: QuizCreatorProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Wizard Mode State (mobile friendly)
  const [currentStep, setCurrentStep] = useState(0); 
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState<string>(initialData?.description || "");
  const [subject, setSubject] = useState<string>(initialData?.subject || "");
  const [questions, setQuestions] = useState<
    {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }[]
  >(initialData?.questions || [
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    },
  ]);
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? false);

  const [aiPrompt, setAiPrompt] = useState(`Create a comprehensive quiz based on the attached content / context.
Return ONLY a raw JSON object (no markdown formatting) with this schema:
{
  "title": "Quiz Title",
  "description": "Short description",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0, // Index 0-3
      "explanation": "Explanation of why this is correct."
    }
  ]
}`);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
      },
    ]);
    setCurrentStep(questions.length); // Move to new question
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
      if (currentStep >= newQuestions.length) {
         setCurrentStep(newQuestions.length - 1);
      }
    } else {
       toast.error("Quiz must have at least one question.");
    }
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].question = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (
    qIndex: number,
    oIndex: number,
    value: string
  ) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctAnswer = oIndex;
    setQuestions(newQuestions);
  };

  const handleExplanationChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].explanation = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Validate with Zod
      const quizData = { title, description, questions, is_public: isPublic };
      QuizSchema.parse(quizData);

      if (!user) {
         toast.error("You must be logged in to save quizzes.");
         return;
      }

      const savedQuiz = await quizService.saveQuiz({
         ...initialData,
         user_id: user.id,
         title,
         description,
         questions,
         icon: initialData?.icon || "✏️",
         color: initialData?.color || "from-zinc-500 to-zinc-700",
         creator_email: initialData?.creator_email || user.email,
         is_public: isPublic,
         subject
      }, !initialData?.id);

      toast.success("Quiz saved successfully!");
      onSave({ ...savedQuiz, id: savedQuiz.id }); 

    } catch (e: unknown) {
       if (e instanceof z.ZodError) {
          const error = e.issues[0];
          let message = error.message;

          // If the error is inside the questions array, make it more helpful
          if (error.path[0] === 'questions' && typeof error.path[1] === 'number') {
            const questionIndex = error.path[1] + 1;
            const field = error.path[2];
            
            if (field === 'question') message = `Question ${questionIndex} is empty.`;
            else if (field === 'options') message = `Question ${questionIndex} options are incomplete.`;
            else message = `Question ${questionIndex}: ${message}`;
          }
          
          toast.error("Validation Error", {
            description: message
          });
       } else {
          const error = e as { message?: string };
          let message = error.message || "Failed to save quiz";
          let description = "An unexpected error occurred. Please try again.";

          // Map technical Supabase errors to user-friendly messages
          if (message.includes("row-level security")) {
            message = "Permission Denied";
            description = "You do not have permission to modify this quiz. Make sure you are the author.";
          } else if (message.includes("network")) {
            message = "Connection Error";
            description = "Could not reach the database. Please check your internet connection.";
          }
          
          toast.error(message, { description });
       }
    } finally {
       setLoading(false);
    }
  };

  const handleJsonImport = () => {
    try {
       const parsed = JSON.parse(jsonInput);
       const result = QuizSchema.safeParse(parsed);
       
       if (!result.success) {
          throw new Error(result.error.issues[0].message);
       }

       setTitle(parsed.title || "");
       setDescription(parsed.description || "");
       setQuestions(parsed.questions);
       setMode('form');
       setJsonError(null);
       toast.success("Data imported successfully!");
    } catch (e: unknown) {
       const errorMessage = e instanceof Error ? e.message : "Invalid JSON";
       setJsonError(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm py-4 mb-6 flex flex-col md:flex-row justify-between items-center border-b border-border gap-4">
         <div className="flex gap-4 items-center w-full md:w-auto">
            <h2 className="text-xl font-semibold">Quiz Editor</h2>
            <div className="flex bg-muted rounded-lg p-1">
               <button 
                  onClick={() => setMode('form')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mode === 'form' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
               >
                  Visual
               </button>
               <button 
                  onClick={() => setMode('json')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mode === 'json' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
               >
                  Import / AI
               </button>
            </div>
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <Button 
               onClick={() => {
                  const hasContent = title || description || questions.some(q => q.question);
                  if (hasContent) {
                     setShowCancelConfirm(true);
                     return;
                  }
                  onCancel();
               }} 
               variant="ghost" 
               disabled={loading}
            >
               Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 md:flex-none">
               {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Protocol</>}
            </Button>
         </div>
      </div>

      {mode === 'json' ? (
         <QuizImportView 
            jsonInput={jsonInput}
            setJsonInput={setJsonInput}
            jsonError={jsonError}
            onImport={handleJsonImport}
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
         />
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
             {/* Left Sidebar: Quiz Info & Question List */}
             <div className="md:col-span-4 space-y-6">
                <QuizMetadataForm 
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  subject={subject}
                  setSubject={setSubject}
                  isPublic={isPublic}
                  setIsPublic={setIsPublic}
                />

                <QuestionList 
                  questions={questions}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  onAddQuestion={handleAddQuestion}
                  onRemoveQuestion={handleRemoveQuestion}
                />
             </div>

             {/* Right Main Area: Active Question Editor */}
             <div className="md:col-span-8">
                <QuestionEditor 
                  question={questions[currentStep]}
                  index={currentStep}
                  totalQuestions={questions.length}
                  onQuestionChange={(val) => handleQuestionChange(currentStep, val)}
                  onOptionChange={(oIndex, val) => handleOptionChange(currentStep, oIndex, val)}
                  onCorrectAnswerChange={(oIndex) => handleCorrectAnswerChange(currentStep, oIndex)}
                  onExplanationChange={(val) => handleExplanationChange(currentStep, val)}
                  onRemove={() => handleRemoveQuestion(currentStep)}
                  onAdd={handleAddQuestion}
                  onNext={() => setCurrentStep(prev => prev + 1)}
                  onPrev={() => setCurrentStep(prev => prev - 1)}
                />

                {/* Desktop Add Button (Bottom) */}
                <div className="hidden md:flex justify-end mt-4">
                   <Button onClick={handleAddQuestion} variant="outline" className="border-dashed w-full h-12">
                      <Plus className="w-4 h-4 mr-2" /> Add New Question
                   </Button>
                </div>
             </div>
         </div>
      )}
     <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={onCancel}
        title="Discard Changes?"
        description="You have unsaved changes in this quiz. Are you sure you want to discard them and return to the dashboard?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        variant="destructive"
      />
    </div>
  );
}
