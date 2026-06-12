"use client";

import { Loader2, Mail, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/admin-api";

import { AddLoginEmailDialog } from "./_AddLoginEmailDialog";

import type { LoginEmail } from "./_useSecurityData";

interface LoginEmailsSectionProps {
  adminId: string;
  primaryEmail: string;
  loginEmails: LoginEmail[];
  setLoginEmails: React.Dispatch<React.SetStateAction<LoginEmail[]>>;
  onAddSuccess: () => void;
}

export function LoginEmailsSection({
  adminId,
  primaryEmail,
  loginEmails,
  setLoginEmails,
  onAddSuccess,
}: LoginEmailsSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddEmail, setShowAddEmail] = useState(false);

  const handleDelete = async (emailId: string) => {
    setDeletingId(emailId);
    try {
      await adminApi.delete("admin_login_emails", emailId);
      setLoginEmails((prev) => prev.filter((e) => e.id !== emailId));
      toast.success("Имэйл хаяг устгагдлаа");
    } catch {
      toast.error("Имэйл хаяг устгахад алдаа гарлаа");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">Нэвтрэх имэйл хаягууд</Label>
        <p className="text-sm text-muted-foreground">
          Эдгээр имэйл хаягаар админ системд нэвтрэх боломжтой
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{primaryEmail}</span>
        </div>
        <Badge variant="secondary">Үндсэн</Badge>
      </div>

      {loginEmails.map((loginEmail) => (
        <div
          key={loginEmail.id}
          className="flex items-center justify-between rounded-md border p-3"
        >
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{loginEmail.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={loginEmail.is_verified ? "default" : "outline"}>
              {loginEmail.is_verified ? "Баталгаажсан" : "Хүлээгдэж буй"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(loginEmail.id)}
              disabled={deletingId === loginEmail.id}
            >
              {deletingId === loginEmail.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={() => setShowAddEmail(true)}>
        <Plus className="mr-1 h-4 w-4" />
        Имэйл нэмэх
      </Button>

      <AddLoginEmailDialog
        adminId={adminId}
        open={showAddEmail}
        onOpenChange={setShowAddEmail}
        onSuccess={onAddSuccess}
      />
    </div>
  );
}
