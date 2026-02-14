import { Quiz, quizzes as staticQuizzes } from "@/app/data/quizzes";
import { QuizCard } from "./QuizCard";
import { Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface QuizGridProps {
  quizzes: Record<string, Quiz>;
  loading: boolean;
  user: User | null;
  onStart: (id: string) => void;
  onEdit: (e: React.MouseEvent, quiz: Quiz) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

import { useState } from "react";
import { Folder, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { FolderCard } from "./FolderCard";

export function QuizGrid({ quizzes, loading, user, onStart, onEdit, onDelete }: QuizGridProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  if (loading) {
     return (
        <div className="flex justify-center py-20">
           <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
     );
  }

  const visibleQuizzes = Object.values(quizzes).filter(quiz => {
    const isOwner = user && quiz.creator_email === user.email;
    return quiz.is_public || isOwner || !quiz.creator_email;
  });

  // Group quizzes by subject
  const subjects: Record<string, number> = {};
  const rootQuizzes: Quiz[] = [];

  visibleQuizzes.forEach(quiz => {
    if (quiz.subject) {
      subjects[quiz.subject] = (subjects[quiz.subject] || 0) + 1;
    } else {
      rootQuizzes.push(quiz);
    }
  });

  const uniqueSubjects = Object.keys(subjects).sort();

  // If inside a folder, show only quizzes for that subject
  if (selectedSubject) {
     const folderQuizzes = visibleQuizzes.filter(q => q.subject === selectedSubject);
     
     return (
        <div className="space-y-6">
           {/* Breadcrumb Navigation */}
           <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedSubject(null)}
                className="hover:text-foreground hover:bg-transparent px-0 font-normal"
              >
                 <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
              <span className="opacity-50">/</span>
              <span className="font-semibold text-foreground flex items-center gap-2">
                 <Folder className="w-4 h-4 text-amber-500 fill-amber-500" />
                 {selectedSubject}
              </span>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {folderQuizzes.map(quiz => {
                 const isCustom = !staticQuizzes[quiz.id];
                 return (
                    <QuizCard 
                      key={quiz.id}
                      quiz={quiz}
                      user={user}
                      isCustom={isCustom}
                      onStart={onStart}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                 );
              })}
           </div>
           {folderQuizzes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                 No quizzes in this folder.
              </div>
           )}
        </div>
     );
  }

  // Root View: Folders first, then standard quizzes
  return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Render Folders */}
        {uniqueSubjects.map(subject => (
           <FolderCard 
              key={subject}
              subject={subject}
              count={subjects[subject]}
              onClick={() => setSelectedSubject(subject)}
           />
        ))}

        {/* Render Root (Uncategorized) Quizzes */}
        {rootQuizzes.map((quiz) => {
           const isCustom = !staticQuizzes[quiz.id]; 
           return (
             <QuizCard 
               key={quiz.id}
               quiz={quiz}
               user={user}
               isCustom={isCustom}
               onStart={onStart}
               onEdit={onEdit}
               onDelete={onDelete}
             />
           );
        })}
     </div>
  );
}
