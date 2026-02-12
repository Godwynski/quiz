import { z } from "zod";

export const OptionSchema = z.string().min(1, "Option cannot be empty");

export const QuestionSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  options: z.array(OptionSchema).length(4, "Must provide exactly 4 options"),
  correctAnswer: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
});

export const QuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  questions: z.array(QuestionSchema).min(1, "Quiz must have at least 1 question"),
});

export type QuizInput = z.infer<typeof QuizSchema>;
