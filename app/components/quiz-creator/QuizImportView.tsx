import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { Bot, Check, Copy, FileJson, AlertCircle } from "lucide-react";
import { useState } from "react";

interface QuizImportViewProps {
  jsonInput: string;
  setJsonInput: (value: string) => void;
  jsonError: string | null;
  onImport: () => void;
  aiPrompt: string;
  setAiPrompt: (value: string) => void;
}

const PROMPT_TEMPLATES = {
  "Standard": `Generate a quiz based on the following content.
Output ONLY raw JSON (no markdown formatting, no code blocks).
Structure:
{
  "title": "Quiz Title",
  "description": "Brief description",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0, // Index of correct option (0-3)
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}
Requirements:
- Create 5-10 multiple choice questions
- 4 options per question
- Varied difficulty levels
- PURE JSON ONLY. Do not wrap in \`\`\`json tags.`,

  "True/False": `Generate a True/False style quiz.
Output ONLY raw JSON (no markdown formatting, no code blocks).
Structure:
{
  "title": "True/False Assessment",
  "description": "Test your knowledge with these statements.",
  "questions": [
    {
      "question": "Statement to evaluate...",
      "options": ["True", "False", "Not stated", "Ambiguous"],
      "correctAnswer": 0,
      "explanation": "Why it is True/False"
    }
  ]
}
Requirements:
- 10 questions
- Options must always include "True" and "False" as the first two
- PURE JSON ONLY. Do not wrap in \`\`\`json tags.`,

  "Hard Mode": `Create a CHALLENGING advanced-level quiz for Experts.
Output ONLY raw JSON (no markdown formatting, no code blocks).
Structure:
{
  "title": "Advanced Quiz",
  "description": "Expert level assessment",
  "questions": [
    {
      "question": "Complex scenario/question?",
      "options": ["Plausible Distractor A", "Correct Answer", "Plausible Distractor B", "Plausible Distractor C"],
      "correctAnswer": 1,
      "explanation": "Detailed technical explanation"
    }
  ]
}
Requirements:
- Questions should require critical thinking, not just recall
- Distractors must be highly plausible
- 4 options per question
- PURE JSON ONLY. Do not wrap in \`\`\`json tags.`,

  "Creative": `Create a fun, scenario-based quiz.
Output ONLY raw JSON (no markdown formatting, no code blocks).
Structure:
{
  "title": "Scenario Quiz 🎭",
  "description": "Fun and engaging assessment",
  "questions": [
    {
      "question": "Situation: [Scenario]. What do you do? 🤔",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is the best move"
    }
  ]
}
Requirements:
- Use emojis in question text
- Frame questions as "What would you do?" or real-world scenarios
- Tone: Witty and engaging
- 4 options per question
- PURE JSON ONLY. Do not wrap in \`\`\`json tags.`
};

export function QuizImportView({
  jsonInput,
  setJsonInput,
  jsonError,
  onImport,
  aiPrompt,
  setAiPrompt
}: QuizImportViewProps) {
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const copyAiPrompt = () => {
     navigator.clipboard.writeText(aiPrompt);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
       <Card className="doodle-border border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
             <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                   <Bot className="w-5 h-5" />
                   Generate with AI
                </CardTitle>
                <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setShowPrompt(!showPrompt)}
                   className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                >
                   {showPrompt ? "Hide Prompt" : "Show Prompt"}
                </Button>
             </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm text-muted-foreground">
                Select a template, then copy the prompt to ChatGPT/Claude along with your notes.
             </p>

             {/* Prompt Templates */}
             {showPrompt && (
                <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in zoom-in-95 duration-200">
                   {Object.entries(PROMPT_TEMPLATES).map(([name, template]) => (
                      <Button
                         key={name}
                         variant="outline"
                         size="sm"
                         onClick={() => setAiPrompt(template)}
                         className="bg-white/50 hover:bg-white text-xs border-blue-200 text-blue-700"
                      >
                         {name}
                      </Button>
                   ))}
                </div>
             )}
             
             {showPrompt && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                   <Textarea 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="font-mono text-xs md:text-sm min-h-[200px] bg-background/50 mb-4"
                   />
                </div>
             )}

             <Button 
                onClick={copyAiPrompt} 
                variant="outline" 
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
             >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy Prompt to Clipboard"}
             </Button>
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

             <Button onClick={onImport} className="w-full h-12">
                Load Data into Editor
             </Button>
          </CardContent>
       </Card>
    </div>
  );
}
