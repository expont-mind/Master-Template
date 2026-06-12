"use client";

import { Loader2, Shield } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { LoginEmailsSection } from "./_LoginEmailsSection";
import { TwoFactorToggle } from "./_TwoFactorToggle";
import { useSecurityData } from "./_useSecurityData";

export default function SecurityCard() {
  const { adminData, loginEmails, setLoginEmails, isLoading, reload } = useSecurityData();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!adminData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Аюулгүй байдал
        </CardTitle>
        <CardDescription>Нэвтрэх болон хамгаалалтын тохиргоо</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <TwoFactorToggle adminId={adminData.id} initialEnabled={adminData.two_factor_enabled} />

        <Separator />

        <LoginEmailsSection
          adminId={adminData.id}
          primaryEmail={adminData.email}
          loginEmails={loginEmails}
          setLoginEmails={setLoginEmails}
          onAddSuccess={reload}
        />
      </CardContent>
    </Card>
  );
}
