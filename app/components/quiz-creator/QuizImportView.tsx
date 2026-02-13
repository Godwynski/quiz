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
                Copy this prompt and paste it into ChatGPT, Claude, or any LLM along with your module/PDF content.
             </p>
             
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
