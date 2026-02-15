import { useState, useCallback, useEffect } from "react";
import { Quiz } from "@/app/data/quizzes";
import { supabase } from "@/app/lib/supabase";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

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
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Define the shape of the joined data
        type QuizWithProfile = Quiz & {
          profiles: {
            username: string | null;
            avatar_url: string | null;
          } | null;
        };

        const fetchedQuizzes: Record<string, Quiz> = {};
        (data as unknown as QuizWithProfile[]).forEach((q) => {
           const profile = q.profiles;
           const quiz: Quiz = {
             ...q,
             creator_username: profile?.username || undefined,
             creator_avatar_url: profile?.avatar_url || undefined
           };
           // Remove the profiles property to match Quiz interface
           if ('profiles' in quiz) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             delete (quiz as any).profiles;
           }
           fetchedQuizzes[quiz.id] = quiz;
        });
        setCustomQuizzes(fetchedQuizzes);
        setAllQuizzes(fetchedQuizzes);
      }
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
