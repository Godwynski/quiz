import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";

interface QuizMetadataFormProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
}

export function QuizMetadataForm({ 
  title, 
  setTitle, 
  description, 
  setDescription, 
  isPublic, 
  setIsPublic 
}: QuizMetadataFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Quiz Title" 
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Short description" 
          />
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <input 
            type="checkbox" 
            id="isPublic" 
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary doodle-action"
          />
          <Label htmlFor="isPublic" className="font-medium cursor-pointer">
            Make Public? (Visible to everyone)
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
