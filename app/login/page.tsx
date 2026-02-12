"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created! You can now log in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Logged in successfully");
        router.push("/");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Enter your email below to create your account"
              : "Enter your email below to login to your account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
            <Button
              variant="link"
              className="w-full text-zinc-500"
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
