"use client";

import Link from "next/link";

import { Slash } from "@/components/svg";

import { PersonalNameFields } from "./personal/_PersonalNameFields";
import { PersonalPhoneFields } from "./personal/_PersonalPhoneFields";
import { usePersonalForm } from "./personal/_usePersonalForm";

import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

interface PersonalContentProps {
  user: UserRow | null;
  onRefresh: () => Promise<void>;
}

export const PersonalContent = ({ user, onRefresh }: PersonalContentProps) => {
  const { formData, errors, loading, saveError, hasChanges, setField, handleBlur, handleSave } =
    usePersonalForm(user, onRefresh);

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-px md:px-0.5">
          <Link
            href="/profile"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Профайл
          </Link>
          <Slash />
          <p className="text-slate-950 text-sm font-normal font-manrope">Хувийн мэдээлэл</p>
        </div>
        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-text-primary font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Хувийн мэдээлэл
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <PersonalNameFields
          formData={formData}
          errors={errors}
          setField={setField}
          handleBlur={handleBlur}
        />
        <PersonalPhoneFields
          formData={formData}
          errors={errors}
          setField={setField}
          handleBlur={handleBlur}
        />
      </div>

      {saveError && <p className="text-brand-primary text-sm font-manrope mt-4">{saveError}</p>}

      <div className="flex justify-end pt-10">
        <button
          onClick={handleSave}
          disabled={loading || !hasChanges}
          className={`bg-text-primary text-white font-normal text-base font-manrope leading-5 px-3 py-2.5 rounded-[4px] transition-colors duration-200 ${
            loading || !hasChanges
              ? "cursor-not-allowed bg-text-primary/30"
              : "cursor-pointer hover:bg-surface-dark"
          }`}
        >
          {loading ? "Хадгалж байна..." : "Хадгалах"}
        </button>
      </div>
    </div>
  );
};
