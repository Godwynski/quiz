"use client";

import { useAuth } from "@/app/components/auth-provider";
import { useAttemptHistory } from "@/app/hooks/useAttemptHistory";
import { useQuizzes } from "@/app/hooks/useQuizzes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { 
  BarChart3, 
  Calendar, 
  Target, 
  Award, 
  ArrowLeft,
  TrendingUp,
  Activity,
  User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const { history, loading: historyLoading } = useAttemptHistory(user?.id);
  const { quizzes, loading: quizzesLoading } = useQuizzes();
  
  const loading = authLoading || (user && (historyLoading || quizzesLoading));

  if (!user && !authLoading) {
     return (
        <div className="min-h-screen flex items-center justify-center p-4">
           <Card className="max-w-md w-full text-center p-6 space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                 <UserIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold">Sign in to view analytics</h2>
              <p className="text-muted-foreground">Track your progress and performance across all quizzes.</p>
              <Button asChild className="w-full">
                 <Link href="/">Go to Dashboard</Link>
              </Button>
           </Card>
        </div>
     );
  }

  if (loading) {
     return (
        <div className="min-h-screen flex items-center justify-center">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
     );
  }

  // --- Aggregate Data ---

  // 1. Overview Stats
  const totalAttempts = history.length;
  const totalScore = history.reduce((acc, curr) => acc + curr.score, 0);
  const totalPossible = history.reduce((acc, curr) => acc + curr.total_questions, 0);
  const averageAccuracy = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
  
  // Calculate "Total XP" approximation or fetch from profile if available (using history for now)
  // Note: Actual XP logic is complex (first attempt vs improvement), this is just a raw sum of scores * 10 
  // For display, let's use Accuracy as the main metric instead of XP to avoid confusion with the gamified XP.

  // 2. Subject Performance
  const subjectStats: Record<string, { total: number; correct: number; attempts: number }> = {};
  
  history.forEach(attempt => {
     // Find quiz to get subject
     const quiz = quizzes.find(q => q.id === attempt.quiz_id);
     const subject = quiz?.subject || 'Uncategorized';
     
     if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, correct: 0, attempts: 0 };
     }
     
     subjectStats[subject].total += attempt.total_questions;
     subjectStats[subject].correct += attempt.score;
     subjectStats[subject].attempts += 1;
  });

  const subjectPerformance = Object.entries(subjectStats)
     .map(([subject, stats]) => ({
        subject,
        accuracy: Math.round((stats.correct / stats.total) * 100),
        attempts: stats.attempts
     }))
     .sort((a, b) => b.accuracy - a.accuracy); // Sort by best performance due to "Strengths" focus

  // 3. Recent Activity (Last 5)
  const recentActivity = history.slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/">
                 <ArrowLeft className="w-5 h-5" />
              </Link>
           </Button>
           <div>
              <h1 className="text-3xl font-black tracking-tight">Analytics</h1>
              <p className="text-muted-foreground font-medium">Your learning journey at a glance</p>
           </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">Total Quizzes</CardTitle>
                 <Activity className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                 <div className="text-2xl font-bold">{totalAttempts}</div>
                 <p className="text-xs text-muted-foreground">Completed attempts</p>
              </CardContent>
           </Card>
           
           <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">Average Accuracy</CardTitle>
                 <Target className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                 <div className="text-2xl font-bold">{averageAccuracy}%</div>
                 <p className="text-xs text-muted-foreground">Across all subjects</p>
              </CardContent>
           </Card>

           <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">Top Subject</CardTitle>
                 <Award className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                 <div className="text-2xl font-bold truncate">
                    {subjectPerformance.length > 0 ? subjectPerformance[0].subject : '-'}
                 </div>
                 <p className="text-xs text-muted-foreground">
                    {subjectPerformance.length > 0 ? `${subjectPerformance[0].accuracy}% accuracy` : 'No data yet'}
                 </p>
              </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Subject Performance Chart */}
           <Card className="lg:col-span-2">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Subject Performance
                 </CardTitle>
                 <CardDescription>Your average score accuracy per subject</CardDescription>
              </CardHeader>
              <CardContent>
                 {subjectPerformance.length > 0 ? (
                    <div className="space-y-4">
                       {subjectPerformance.map((item) => (
                          <div key={item.subject} className="space-y-1">
                             <div className="flex justify-between text-sm font-medium">
                                <span>{item.subject}</span>
                                <span className="text-muted-foreground">{item.accuracy}%</span>
                             </div>
                             <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                   className={`h-full ${
                                      item.accuracy >= 80 ? 'bg-green-500' :
                                      item.accuracy >= 60 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                   }`}
                                   initial={{ width: 0 }}
                                   animate={{ width: `${item.accuracy}%` }}
                                   transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                       <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                       <p>Complete quizzes to see your subject breakdown</p>
                    </div>
                 )}
              </CardContent>
           </Card>

           {/* Recent Activity Feed */}
           <Card className="h-fit">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Recent Activity
                 </CardTitle>
                 <CardDescription>Your latest quiz results</CardDescription>
              </CardHeader>
              <CardContent>
                 {recentActivity.length > 0 ? (
                    <div className="space-y-6">
                       {recentActivity.map((attempt) => (
                          <div key={attempt.id} className="flex items-start justify-between border-b last:border-0 pb-4 last:pb-0">
                             <div>
                                <h4 className="font-semibold line-clamp-1">{attempt.quiz_title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                   {formatDistanceToNow(new Date(attempt.completed_at), { addSuffix: true })}
                                </p>
                             </div>
                             <div className="text-right">
                                <div className={`font-bold ${
                                   attempt.score === attempt.total_questions ? 'text-green-600' : 
                                   (attempt.score / attempt.total_questions) >= 0.7 ? 'text-blue-600' : 'text-zinc-600'
                                }`}>
                                   {attempt.score}/{attempt.total_questions}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                                   {Math.round((attempt.score / attempt.total_questions) * 100)}%
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                       <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
                       <p>No activity yet.</p>
                       <Button variant="link" asChild className="mt-2">
                          <Link href="/">Take your first quiz</Link>
                       </Button>
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
