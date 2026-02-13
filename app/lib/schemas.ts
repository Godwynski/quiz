import { z } from "zod";

export const OptionSchema = z.string().min(1, "Option cannot be empty").max(200, "Option is too long");

export const QuestionSchema = z.object({
  question: z.string().min(1, "Question cannot be empty").max(500, "Question is too long"),
  options: z.array(OptionSchema).length(4, "Must provide exactly 4 options"),
  correctAnswer: z.number().int().min(0).max(3),
  explanation: z.string().max(1000, "Explanation is too long").optional(),
});

export const QuizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description is too long"),
  questions: z.array(QuestionSchema).min(1, "Quiz must have at least 1 question").max(50, "Quiz cannot have more than 50 questions"),
  is_public: z.boolean().optional(),
});

export type QuizInput = z.infer<typeof QuizSchema>;
