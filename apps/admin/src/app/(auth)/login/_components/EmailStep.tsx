"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { type LoginState } from "./_useLogin";

export function EmailStep({ state }: { state: LoginState }) {
  const { email, setEmail, error, isLoading, handleLogin } = state;
  return (
    <>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Монпанг Админ</CardTitle>
        <CardDescription>Имэйл хаягаа оруулан нэвтэрнэ үү</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Имэйл</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@monpang.mn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Нэвтэрж байна...
              </>
            ) : (
              "Нэвтрэх"
            )}
          </Button>
        </form>
      </CardContent>
    </>
  );
}
