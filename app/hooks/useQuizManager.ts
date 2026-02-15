import { useState, useEffect, useMemo } from "react";
import { Quiz } from "@/app/data/quizzes";

import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { quizService } from "../features/quiz/services/quizService";
import { useQuizzes } from "./useQuizzes";
import { useUserAttempts } from "./useUserAttempts";

export type QuizState = "home" | "quiz" | "create" | "edit";

export function useQuizManager(user: User | null) {
  const [quizState, setQuizState] = useState<QuizState>("home");
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  
  // SWR Hooks
  const { quizzes: fetchedQuizzes, loading: loadingQuizzes, mutate: mutateQuizzes } = useQuizzes();
  const { userAttempts, mutate: mutateAttempts } = useUserAttempts(user?.id);

  // Derived State (Memoized to prevent loops)
  const allQuizzes = useMemo(() => {
    const quizzesRecord: Record<string, Quiz> = {};
    fetchedQuizzes.forEach(q => {
      quizzesRecord[q.id] = q;
    });
    return quizzesRecord;
  }, [fetchedQuizzes]);

  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  
  // Edit Mode
  const [quizToEdit, setQuizToEdit] = useState<Quiz | undefined>(undefined);

  useEffect(() => {
    const handlePopState = () => {
      setQuizState('home');
      setCurrentSubject(null);
      setQuizToEdit(undefined);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    if (!user) {
        toast.error("Please login to create quizzes"); 
        return;
    }
    setQuizState('create');
    window.history.pushState({ state: 'create' }, '');
  };

  const handleExitQuiz = () => {
    setQuizState('home');
    setCurrentSubject(null);
    setQuizToEdit(undefined);
    if (window.history.state) window.history.back();
    // Refresh attempts when exiting a quiz to show updated XP/Status
    mutateAttempts();
  };

  const handleSaveQuiz = async (_newQuiz: Quiz) => {
    // Optimistic Update handled by SWR revalidation
    setQuizState('home');
    setQuizToEdit(undefined);
    await mutateQuizzes();
  };

  const handleDeleteQuiz = (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    setQuizToDelete(quizId);
  };

  const confirmDelete = async () => {
    if (!quizToDelete) return;
    const quizId = quizToDelete;

    try {
       await quizService.deleteQuiz(quizId);
       toast.success("Quiz deleted");
       mutateQuizzes(); // Refresh list
    } catch {
       toast.error("Failed to delete quiz");
    } finally {
       setQuizToDelete(null);
    }
  };

  const handleDuplicateQuiz = async (e: React.MouseEvent, quiz: Quiz) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to duplicate quizzes");
      return;
    }
    
    try {
      await quizService.duplicateQuiz(quiz.id, user.id);
      toast.success("Quiz duplicated");
      mutateQuizzes();
    } catch (error) {
      console.error("Duplicate error", error);
      toast.error("Failed to duplicate quiz");
    }
  };

  const handleArchiveQuiz = async (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    try {
      await quizService.archiveQuiz(quizId);
      toast.success("Quiz archived");
      mutateQuizzes();
    } catch (error) {
       console.error("Archive error", error);
       toast.error("Failed to archive quiz");
    }
  };

  return {
    quizState,
    setQuizState,
    currentSubject,
    allQuizzes,
    loadingQuizzes,
    quizToDelete,
    setQuizToDelete,
    quizToEdit,
    setQuizToEdit,
    handleEditQuiz,
    handleStartQuiz,
    handleCreateQuiz,
    handleExitQuiz,
    handleSaveQuiz,
    handleDeleteQuiz,
    confirmDelete,
    userAttempts,
    handleDuplicateQuiz,
    handleArchiveQuiz
  };
}
