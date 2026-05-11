"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Shield, Mail } from "lucide-react";
import { toast } from "sonner";

interface AdminData {
  id: string;
  email: string;
  two_factor_enabled: boolean;
  role_id: string | null;
}

interface LoginEmail {
  id: string;
  admin_id: string;
  email: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export default function SecurityCard() {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loginEmails, setLoginEmails] = useState<LoginEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Имэйл нэмэх dialog
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Устгах
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) return;

      // Admin мэдээлэл авах
      const admins = await adminApi.getAll<AdminData>("admins", {
        filters: { "email.eq": user.email },
        select: "id,email,two_factor_enabled,role_id",
      });

      let admin = admins[0];

      // Нэмэлт имэйлээр нэвтэрсэн бол
      if (!admin) {
        const altEmails = await adminApi.getAll<LoginEmail>(
          "admin_login_emails",
          {
            filters: { "email.eq": user.email, "is_verified.eq": "true" },
          }
        );
        if (altEmails[0]) {
          const adminById = await adminApi.getById<AdminData>(
            "admins",
            altEmails[0].admin_id,
            { select: "id,email,two_factor_enabled,role_id" }
          );
          admin = adminById;
        }
      }

      if (admin) {
        setAdminData(admin);
        setTwoFactorEnabled(admin.two_factor_enabled);

        // Нэмэлт имэйлүүд
        const emails = await adminApi.getAll<LoginEmail>(
          "admin_login_emails",
          {
            filters: { "admin_id.eq": admin.id },
            order: "created_at.asc",
          }
        );
        setLoginEmails(emails);
      }
    } catch (error) {
      log.error("security_data_load_failed", error);
      toast.error("Мэдээлэл ачаалахад алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (!adminData) return;
    setIsToggling(true);

    try {
      await adminApi.update("admins", adminData.id, {
        two_factor_enabled: enabled,
      });
      setTwoFactorEnabled(enabled);
      toast.success(
        enabled
          ? "Хоёр шатлалт баталгаажуулалт идэвхжлээ"
          : "Хоёр шатлалт баталгаажуулалт идэвхгүй боллоо"
      );
    } catch {
      toast.error("Тохиргоо хадгалахад алдаа гарлаа");
      setTwoFactorEnabled(!enabled);
    } finally {
      setIsToggling(false);
    }
  };

  const handleAddEmail = async () => {
    if (!adminData || !newEmail) return;
    setIsAdding(true);

    try {
      const res = await fetch("/api/admin/email-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminData.id, email: newEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Имэйл нэмэхэд алдаа гарлаа");
        return;
      }

      toast.success("Баталгаажуулах линк илгээгдлээ. Имэйлээ шалгана уу.");
      setShowAddEmail(false);
      setNewEmail("");
      loadData();
    } catch {
      toast.error("Имэйл нэмэхэд алдаа гарлаа");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
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

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setNewEmail("");
    }
    setShowAddEmail(open);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Аюулгүй байдал
          </CardTitle>
          <CardDescription>
            Нэвтрэх болон хамгаалалтын тохиргоо
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 2FA Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">
                Хоёр шатлалт баталгаажуулалт (2FA)
              </Label>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled
                  ? "Имэйлээр OTP код ашиглан нэвтэрч байна"
                  : "Имэйл оруулахад шууд нэвтэрнэ"}
              </p>
            </div>
            <Button
              variant={twoFactorEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle2FA(!twoFactorEnabled)}
              disabled={isToggling}
            >
              {isToggling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {twoFactorEnabled ? "Идэвхжсэн" : "Идэвхжүүлэх"}
            </Button>
          </div>

          <Separator />

          {/* Нэвтрэх имэйл хаягууд */}
          <div className="space-y-4">
            <div>
              <Label className="text-base">Нэвтрэх имэйл хаягууд</Label>
              <p className="text-sm text-muted-foreground">
                Эдгээр имэйл хаягаар админ системд нэвтрэх боломжтой
              </p>
            </div>

            {/* Үндсэн имэйл */}
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {adminData?.email}
                </span>
              </div>
              <Badge variant="secondary">Үндсэн</Badge>
            </div>

            {/* Нэмэлт имэйлүүд */}
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
                  <Badge
                    variant={
                      loginEmail.is_verified ? "default" : "outline"
                    }
                  >
                    {loginEmail.is_verified
                      ? "Баталгаажсан"
                      : "Хүлээгдэж буй"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEmail(loginEmail.id)}
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

            {/* Имэйл нэмэх товч */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddEmail(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Имэйл нэмэх
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Имэйл нэмэх Dialog */}
      <Dialog open={showAddEmail} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Нэвтрэх имэйл нэмэх</DialogTitle>
            <DialogDescription>
              Нэмэлт нэвтрэх имэйл хаягаа оруулна уу
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">Имэйл хаяг</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="example@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isAdding}
              />
            </div>
            <Button
              onClick={handleAddEmail}
              disabled={!newEmail || isAdding}
              className="w-full"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Нэмж байна...
                </>
              ) : (
                "Нэмэх"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
