"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Copy, FileJson, AlertCircle, Bot, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "./ui/card";
import { Quiz } from "../data/quizzes";
// import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/components/auth-provider";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { supabase } from "@/app/lib/supabase";
import { toast } from "sonner";
import { QuizSchema } from "@/app/lib/schemas";
import { z } from "zod";

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
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Wizard Mode State (mobile friendly)
  const [currentStep, setCurrentStep] = useState(0); 
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState<string>(initialData?.description || "");
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
      const quizData = { title, description, questions };
      QuizSchema.parse(quizData);

      if (!user) {
         toast.error("You must be logged in to save quizzes.");
         return;
      }

      const payload = { 
         user_id: user.id,
         title,
         description,
         questions,
         icon: initialData?.icon || "✏️",
         color: initialData?.color || "from-zinc-500 to-zinc-700",
         creator_email: initialData?.creator_email || user.email 
      };

      const query = initialData?.id 
        ? supabase.from('quizzes').update(payload).eq('id', initialData.id)
        : supabase.from('quizzes').insert([payload]);

      const { data, error } = await query.select().single();
      
      if (error) throw error;

      toast.success("Quiz saved successfully!");
      onSave({ ...data, id: data.id }); 

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

  const copyAiPrompt = () => {
     const prompt = `Create a quiz about [TOPIC] with 5 questions.
Return ONLY a JSON object with this format:
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
}`;
     navigator.clipboard.writeText(prompt);
     setCopied(true);
     toast.success("Prompt copied to clipboard");
     setTimeout(() => setCopied(false), 2000);
  };

  // Mobile Wizard View
  // Actually, let's implement the "One Question at a Time" view as requested.

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
                  Import
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
         <div className="space-y-6">
            <Card className="border-blue-100 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50">
               <CardContent className="pt-6 flex items-start gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                     <Bot className="w-6 h-6" />
                  </div>
                  <div className="flex-grow space-y-2">
                     <h3 className="font-semibold text-blue-900 dark:text-blue-200">Generate with AI</h3>
                     <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        Copy the prompt below to generate a valid quiz with any LLM.
                     </p>
                     <Button 
                        onClick={copyAiPrompt} 
                        variant="outline" 
                        size="sm"
                        className="mt-2 bg-background border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                     >
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copied!" : "Copy System Prompt"}
                     </Button>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                     <FileJson className="w-5 h-5 text-muted-foreground" />
                     Paste JSON Data
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Textarea 
                     value={jsonInput}
                     onChange={(e) => setJsonInput(e.target.value)}
                     placeholder='{ "title": "My Quiz", "questions": [...] }'
                     className="font-mono text-xs md:text-sm min-h-[400px] resize-y"
                  />
                  
                  {jsonError && (
                     <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                        <AlertCircle className="w-4 h-4" />
                        {jsonError}
                     </div>
                  )}

                  <Button onClick={handleJsonImport} className="w-full h-12">
                     Load Data into Editor
                  </Button>
               </CardContent>
            </Card>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
             {/* Left Sidebar: Quiz Info & Question List */}
             <div className="md:col-span-4 space-y-6">
                <Card>
                   <CardHeader>
                      <CardTitle className="text-base">Metadata</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="space-y-2">
                         <Label>Title</Label>
                         <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz Title" />
                      </div>
                      <div className="space-y-2">
                         <Label>Description</Label>
                         <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
                      </div>
                   </CardContent>
                </Card>

                <div className="hidden md:block space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-sm font-medium text-muted-foreground">Questions</span>
                      <Button variant="ghost" size="sm" onClick={handleAddQuestion}>
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
                               : 'bg-card hover:bg-muted border-border'
                            }`}
                         >
                            <div className="flex justify-between items-center">
                               <span className="font-medium truncate max-w-[150px]">
                                  {q.question || `Question ${i + 1}`}
                               </span>
                               {questions.length > 1 && (
                                  <Trash2 
                                     onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleRemoveQuestion(i); }} 
                                     className="w-4 h-4 opacity-50 hover:opacity-100 hover:text-destructive" 
                                  />
                               )}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Right Main Area: Active Question Editor */}
             <div className="md:col-span-8">
                <div
                    key={currentStep}
                    className="animate-in fade-in slide-in-from-right-4 duration-200"
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg">Question {currentStep + 1}</CardTitle>
                            <div className="flex gap-2 md:hidden">
                            <Button size="icon" variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep(prev => prev - 1)}>
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <span className="flex items-center text-sm text-muted-foreground">
                                {currentStep + 1} / {questions.length}
                            </span>
                            <Button size="icon" variant="outline" disabled={currentStep === questions.length - 1} onClick={() => setCurrentStep(prev => prev + 1)}>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Input 
                                value={questions[currentStep].question}
                                onChange={(e) => handleQuestionChange(currentStep, e.target.value)}
                                placeholder="What is the capital of France?"
                                className="text-lg font-medium" 
                            />
                            </div>

                            <div className="space-y-4">
                            <Label>Answers (Select the correct one)</Label>
                            <div className="grid grid-cols-1 gap-3">
                                {questions[currentStep].options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-3">
                                        <div 
                                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all ${
                                            questions[currentStep].correctAnswer === oIndex
                                            ? 'border-green-500 bg-green-500 text-white'
                                            : 'border-muted-foreground/30 hover:border-primary'
                                        }`}
                                        onClick={() => handleCorrectAnswerChange(currentStep, oIndex)}
                                        >
                                            {questions[currentStep].correctAnswer === oIndex && <Check className="w-3 h-3" />}
                                        </div>
                                        <Input 
                                            value={option}
                                            onChange={(e) => handleOptionChange(currentStep, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-border">
                            <Label>Explanation (Optional)</Label>
                            <Textarea 
                                value={questions[currentStep].explanation}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleExplanationChange(currentStep, e.target.value)}
                                placeholder="Explain why the answer is correct..."
                                className="resize-none h-20"
                            />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between bg-muted/20 py-4">
                            <Button 
                            variant="outline" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveQuestion(currentStep)}
                            disabled={questions.length <= 1}
                            >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Question
                            </Button>
                            
                            {/* Mobile Add Button */}
                            <Button onClick={handleAddQuestion} variant="secondary" className="md:hidden">
                                <Plus className="w-4 h-4 mr-2" /> Add New
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

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
