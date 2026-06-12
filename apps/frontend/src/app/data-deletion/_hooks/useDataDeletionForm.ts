"use client";

import { useState } from "react";

export function useDataDeletionForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email && !phone) {
      setError("Имэйл эсвэл утасны дугаар оруулна уу");
      return;
    }

    setLoading(true);

    // Simulate API call - in production, send to your backend
    try {
      // You can implement actual deletion request logic here
      // For example, send email notification or create a database entry
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch {
      setError("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  const onPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
    setPhone(val);
    setError("");
  };

  const onReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value);

  return {
    email,
    phone,
    reason,
    loading,
    submitted,
    error,
    handleSubmit,
    onEmailChange,
    onPhoneChange,
    onReasonChange,
  };
}
