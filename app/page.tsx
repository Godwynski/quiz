"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Plus, ArrowRight, BookOpen, Edit2, Loader2, LogOut } from "lucide-react";
import { quizzes, Quiz } from "./data/quizzes";
import { Button } from "./components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { useAuth } from "@/app/components/auth-provider";
import { supabase } from "@/app/lib/supabase";
import { toast } from "sonner";
import QuizCreator from "./components/QuizCreator";
import QuizRunner from "./components/QuizRunner";
import { ConfirmDialog } from "./components/ui/confirm-dialog";

type QuizState = "home" | "quiz" | "create" | "edit";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [quizState, setQuizState] = useState<QuizState>("home");
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  
  // Quiz Data
  const [customQuizzes, setCustomQuizzes] = useState<Record<string, Quiz>>({});
  const [allQuizzes, setAllQuizzes] = useState<Record<string, Quiz>>({});
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  // Edit Mode
  const [quizToEdit, setQuizToEdit] = useState<Quiz | undefined>(undefined);

  const fetchCustomQuizzes = useCallback(async () => {
    setLoadingQuizzes(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const fetchedQuizzes: Record<string, Quiz> = {};
        (data as Quiz[]).forEach((q: Quiz) => {
           fetchedQuizzes[q.id] = q;
        });
        setCustomQuizzes(fetchedQuizzes);
        setAllQuizzes(fetchedQuizzes);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to load quizzes: " + errorMessage);
    } finally {
      setLoadingQuizzes(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomQuizzes();

    const handlePopState = () => {
      setQuizState('home');
      setCurrentSubject(null);
      setQuizToEdit(undefined);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fetchCustomQuizzes]);

  const handleEditQuiz = (e: React.MouseEvent, quiz: Quiz) => {
     e.stopPropagation();
     setQuizToEdit(quiz);
     setQuizState('edit');
     window.history.pushState({ state: 'edit' }, '');
  };

  const handleStartQuiz = (subjectId: string) => {
    setCurrentSubject(subjectId);
    setQuizState('quiz');
    window.history.pushState({ state: 'quiz' }, '');
  };

  const handleCreateQuiz = () => {
    setQuizState('create');
    window.history.pushState({ state: 'create' }, '');
  };

  const handleExitQuiz = () => {
    setQuizState('home');
    setCurrentSubject(null);
    if (window.history.state) window.history.back();
  };

  const handleSaveQuiz = (newQuiz: Quiz) => {
    // Optimistic Update
    const updatedCustom = { ...customQuizzes, [newQuiz.id]: newQuiz };
    setCustomQuizzes(updatedCustom);
    setAllQuizzes(updatedCustom);
    setQuizState('home');
    setQuizToEdit(undefined);
    fetchCustomQuizzes(); // Re-fetch to confirm
  };

  const handleDeleteQuiz = (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    setQuizToDelete(quizId);
  };

  const confirmDelete = async () => {
    if (!quizToDelete) return;
    const quizId = quizToDelete;

    // Optimistic Update
    const updatedCustom = { ...customQuizzes };
    delete updatedCustom[quizId];
    setCustomQuizzes(updatedCustom);
    setAllQuizzes(updatedCustom);

    try {
       const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
       if (error) throw error;
       toast.success("Quiz deleted");
    } catch {
       toast.error("Failed to delete quiz");
       fetchCustomQuizzes(); // Revert on failure
    } finally {
       setQuizToDelete(null);
    }
  };

  const currentQuiz: Quiz | null = currentSubject ? allQuizzes[currentSubject] : null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
         <AnimatePresence mode="wait">
            {(quizState === 'create' || quizState === 'edit') && (
               <motion.div
                  key="creator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
               >
                  <QuizCreator 
                     onSave={handleSaveQuiz} 
                     onCancel={() => { 
                        setQuizState('home'); 
                        setQuizToEdit(undefined);
                        if (window.history.state) window.history.back();
                     }} 
                     initialData={quizToEdit}
                  />
               </motion.div>
            )}

            {quizState === 'quiz' && currentQuiz && (
               <motion.div
                  key="quiz"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
               >
                  <QuizRunner quiz={currentQuiz} onExit={handleExitQuiz} />
               </motion.div>
            )}

            {quizState === 'home' && (
              <motion.main
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-12"
              >
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                   <div className="space-y-1">
                      <h1 className="text-3xl font-bold tracking-tight">Quizmaster</h1>
                      <p className="text-muted-foreground max-w-sm">
                         {user ? `Welcome back, ${user.email}` : "Explore and play quizzes below."}
                      </p>
                   </div>
                   <div className="flex gap-4">
                       {user ? (
                          <Button onClick={signOut} variant="ghost">
                             <LogOut className="mr-2 h-4 w-4" /> Sign Out
                          </Button>
                       ) : (
                          <Button onClick={() => window.location.assign('/login')} variant="outline">
                             Sign In
                          </Button>
                       )}
                      <Button 
                         onClick={() => {
                            if (!user) {
                               toast.error("Please login to create quizzes"); 
                               return;
                            }
                            handleCreateQuiz();
                         }}
                         className="rounded-full h-11 px-6 font-medium"
                      >
                         <Plus className="mr-2 h-4 w-4" />
                         Create New
                      </Button>
                   </div>
                </header>
                
                {loadingQuizzes || authLoading ? (
                   <div className="flex justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                   </div>
                ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {Object.values(allQuizzes).map((quiz) => {
                         const isCustom = !quizzes[quiz.id]; // Hardcoded logic
                         return (
                           <Card 
                             key={quiz.id}
                             className="group relative overflow-hidden border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer rounded-xl h-full flex flex-col"
                             onClick={() => handleStartQuiz(quiz.id)}
                           >
                              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${quiz.color?.replace('from-', 'from-').replace('to-', 'to-') || 'from-zinc-500 to-zinc-700'} opacity-80`} />
                              
                              <CardHeader className="pb-4 flex-grow">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-muted rounded-xl text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                       {quiz.icon || "📝"}
                                    </div>
                                    {isCustom && (
                                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button 
                                             variant="ghost" 
                                             size="icon" 
                                             onClick={(e) => handleEditQuiz(e, quiz)}
                                             className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                          >
                                             <Edit2 className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                             variant="ghost" 
                                             size="icon" 
                                             onClick={(e) => handleDeleteQuiz(e, quiz.id)}
                                             className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                          >
                                             <Trash2 className="h-4 w-4" />
                                          </Button>
                                       </div>
                                    )}
                                 </div>
                                 <CardTitle className="text-xl font-semibold leading-tight mb-2">
                                    {quiz.title}
                                 </CardTitle>
                                 <CardDescription className="line-clamp-2 text-sm">
                                    {quiz.description}
                                 </CardDescription>
                              </CardHeader>
                              
                              <CardFooter className="pt-0 mt-auto border-t border-border/50 p-4 bg-muted/20">
                                 <div className="flex items-center text-xs font-medium text-muted-foreground">
                                    <BookOpen className="mr-2 h-3.5 w-3.5" />
                                    {quiz.questions.length} Questions
                                 </div>
                                 {quiz.creator_email && (
                                   <div className="ml-4 flex items-center text-[10px] text-muted-foreground italic truncate max-w-[120px]">
                                      by {quiz.creator_email.split('@')[0]}
                                   </div>
                                 )}
                                 <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </CardFooter>
                           </Card>
                         );
                      })}
                   </div>
                )}
              </motion.main>
            )}
         </AnimatePresence>
      </div>

      <ConfirmDialog 
        isOpen={!!quizToDelete}
        onClose={() => setQuizToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Quiz?"
        description="Are you certain you want to delete this quiz? This action is permanent and cannot be undone."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
