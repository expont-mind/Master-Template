"use client";

import { BRAND } from "@/lib/utils/brand-config";

import { DataDeletionForm } from "./_components/DataDeletionForm";
import { SubmittedView } from "./_components/SubmittedView";
import { useDataDeletionForm } from "./_hooks/useDataDeletionForm";
import { InfoSection } from "./_sections/InfoSection";

export default function DataDeletionPage() {
  const {
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
  } = useDataDeletionForm();

  if (submitted) {
    return <SubmittedView />;
  }

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
        <div className="flex flex-col gap-8 md:gap-12">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-text-primary font-bold text-2xl md:text-[28px] lg:text-[32px] leading-8 md:leading-10 font-manrope">
              Өгөгдөл устгах хүсэлт
            </h1>
            <p className="text-text-secondary font-normal text-sm md:text-base font-manrope max-w-2xl">
              Хэрэв та {BRAND.name} дээрх бүртгэл болон бүх хувийн мэдээллээ устгуулахыг хүсвэл
              доорх маягтыг бөглөнө үү. Бид таны хүсэлтийг 30 хоногийн дотор шийдвэрлэнэ.
            </p>
          </div>

          {/* Form */}
          <DataDeletionForm
            email={email}
            phone={phone}
            reason={reason}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onEmailChange={onEmailChange}
            onPhoneChange={onPhoneChange}
            onReasonChange={onReasonChange}
          />

          <InfoSection />
        </div>
      </div>
    </div>
  );
}
