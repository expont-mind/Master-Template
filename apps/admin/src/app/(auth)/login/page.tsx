"use client";

import { Card } from "@/components/ui/card";

import { useLogin } from "./_components/_useLogin";
import { EmailStep } from "./_components/EmailStep";
import { OtpStep } from "./_components/OtpStep";

export default function LoginPage() {
  const state = useLogin();
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        {state.step === "email" ? <EmailStep state={state} /> : <OtpStep state={state} />}
      </Card>
    </div>
  );
}
