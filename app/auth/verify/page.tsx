import { VerifyForm } from "@/components/auth/verify-form";
import { Logo } from "@/components/ui/logo";

export default function VerifyPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Logo className="h-12 w-12" />
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-sm text-muted-foreground">
            Enter the verification code sent to your email
          </p>
        </div>
        <VerifyForm />
      </div>
    </div>
  );
}
