import { useState, useCallback, useEffect } from "react";
import { Quiz } from "@/app/data/quizzes";

import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { quizService } from "../features/quiz/services/quizService";

export type QuizState = "home" | "quiz" | "create" | "edit";

export function useQuizManager(user: User | null) {
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
      const fetchedQuizzes = await quizService.getQuizzes();
      const quizzesRecord: Record<string, Quiz> = {};
      fetchedQuizzes.forEach(q => {
        quizzesRecord[q.id] = q;
      });
      setCustomQuizzes(quizzesRecord);
      setAllQuizzes(quizzesRecord);
    } catch (error: any) {
      console.error("Fetch error details:", error);
      const errorMessage = error.message || error.error_description || "Unknown error";
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
       await quizService.deleteQuiz(quizId);
       toast.success("Quiz deleted");
    } catch {
       toast.error("Failed to delete quiz");
       fetchCustomQuizzes(); // Revert on failure
    } finally {
       setQuizToDelete(null);
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
    confirmDelete
  };
}
