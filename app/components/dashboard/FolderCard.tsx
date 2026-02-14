import { Folder } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";

interface FolderCardProps {
  subject: string;
  count: number;
  onClick: () => void;
}

export function FolderCard({ subject, count, onClick }: FolderCardProps) {
  return (
    <Card 
      className="group cursor-pointer relative overflow-hidden bg-amber-50 dark:bg-amber-950/20 border-2 border-border doodle-border h-full flex flex-col justify-between"
      onClick={onClick}
    >
      {/* Folder Tab Visual */}
      <div className="absolute top-0 left-0 w-1/3 h-4 bg-amber-200/50 dark:bg-amber-900/40 border-b-2 border-r-2 border-border rounded-br-xl" />

      <CardHeader className="pt-8 pb-4 relative z-10">
        <div className="flex justify-between items-start">
           <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl border-2 border-transparent group-hover:border-border transition-all duration-300 transform group-hover:-rotate-3">
              <Folder className="w-8 h-8 text-amber-500 fill-amber-500/20" />
           </div>
           <div className="text-xs font-bold px-2 py-1 bg-white/80 dark:bg-black/40 rounded-full border border-border/20">
              {count}
           </div>
        </div>
        
        <div className="mt-4">
           <CardTitle className="text-xl font-bold font-sans tracking-wide group-hover:text-primary transition-colors">
              {subject}
           </CardTitle>
           <CardDescription className="text-xs font-medium opacity-70 mt-1">
              {count} {count === 1 ? 'Quiz' : 'Quizzes'} Inside
           </CardDescription>
        </div>
      </CardHeader>
      
      {/* Decorative "Paper" sheets sticking out */}
      <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/40 dark:bg-white/5 border-t-2 border-l-2 border-border/10 rounded-tl-3xl transform translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-300" />
    </Card>
  );
}
