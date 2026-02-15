import { z } from "zod";


export const OptionSchema = z.string().min(1, "Option cannot be empty").max(200, "Option is too long");

// Strict Password Validation
export const PasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");


export const QuestionSchema = z.object({
  question: z.string().min(1, "Question cannot be empty").max(500, "Question is too long"),
  options: z.array(OptionSchema).length(4, "Must provide exactly 4 options"),
  correctAnswer: z.number().int().min(0).max(3),
  // Validate explanation content if provided
  explanation: z.string().min(5, "Explanation must be at least 5 characters").max(1000, "Explanation is too long").optional(),
});

export const QuizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description is too long"),
  questions: z.array(QuestionSchema).min(1, "Quiz must have at least 1 question").max(50, "Quiz cannot have more than 50 questions"),
  
  // New Validations
  subject: z.string().min(2, "Subject must be at least 2 characters").max(50, "Subject is too long").optional(),
  
  // Icon validation: Basic emoji check or length limit typically sufficient for simple use cases
  // For strict emoji, a regex like /^\p{Emoji}$/u could be used, but client-side emoji pickers usually effective.
  // Limiting to short string ensures no text dumps.
  icon: z.string().max(5, "Icon must be an emoji").default("📝"),
  
  // Color validation: Ensure it follows Tailwind-like gradient pattern or is a valid string
  // Simple check for "from-" prefix as a heuristic for now
  color: z.string().refine((val) => val.includes("from-") && val.includes("to-"), {
    message: "Color must be a valid gradient class string"
  }).default("from-zinc-500 to-zinc-700"),
  
  is_public: z.boolean().optional(),
});

export type QuizInput = z.infer<typeof QuizSchema>;
