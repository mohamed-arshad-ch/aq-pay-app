"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const verifySchema = z.object({
  code: z
    .string()
    .min(6, {
      message: "Verification code must be 6 digits.",
    })
    .max(6),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

interface TwoFactorAuthProps {
  email: string;
  onCancel: () => void;
  verifyToken?: string;
}

export function TwoFactorAuth({
  email,
  onCancel,
  verifyToken,
}: TwoFactorAuthProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
    },
  });

  async function onSubmit(data: VerifyFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verifyToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      toast({
        title: "Email verified",
        description: "Your email has been successfully verified.",
      });

      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>
          Please verify your email address to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Verification code sent to {email}</span>
            </div>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 6-digit code"
                      {...field}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onCancel}>
          Back to Login
        </Button>
        <Button variant="link" size="sm" className="text-xs">
          Need help?
        </Button>
      </CardFooter>
    </Card>
  );
}
