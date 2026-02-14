"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/app/components/auth-provider";
import QuizCreator from "@/app/components/QuizCreator";
import QuizRunner from "@/app/components/QuizRunner";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { DashboardHeader } from "@/app/components/dashboard/DashboardHeader";
import { QuizGrid } from "@/app/components/dashboard/QuizGrid";
import { useQuizManager } from "@/app/hooks/useQuizManager";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  
  const { 
    quizState, 
 
    currentSubject, 
    allQuizzes, 
    loadingQuizzes, 
    quizToDelete, 
    setQuizToDelete, 
    quizToEdit, 
    handleEditQuiz,
    handleStartQuiz,
    handleCreateQuiz,
    handleExitQuiz,
    handleSaveQuiz,
    handleDeleteQuiz,
    confirmDelete
  } = useQuizManager(user);

  const currentQuiz = currentSubject ? allQuizzes[currentSubject] : null;

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
                        // We can just call handleExitQuiz here or manually set state if we want specific back behavior?
                        // Original logic: setQuizState('home'); setQuizToEdit(undefined); if (history.state) back();
                        // Let's use the hook's helper or replicate behavior.
                        // Ideally the hook exposes a "handleCancelCreator" or we just key off handleExitQuiz.
                        // Since useQuizManager's handleExitQuiz does setQuizState('home') and history.back(), it should work.
                        // But we also need to clear quizToEdit.
                         handleExitQuiz();
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
                  <ErrorBoundary>
                    <QuizRunner quiz={currentQuiz} user={user} onExit={handleExitQuiz} />
                  </ErrorBoundary>
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
                <DashboardHeader 
                  user={user} 
                  onSignOut={signOut} 
                  onCreateQuiz={handleCreateQuiz} 
                />
                
                <QuizGrid 
                  quizzes={allQuizzes} 
                  loading={loadingQuizzes || authLoading} 
                  user={user}
                  onStart={handleStartQuiz} 
                  onEdit={handleEditQuiz} 
                  onDelete={handleDeleteQuiz}
                />
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
