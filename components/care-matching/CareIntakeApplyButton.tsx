"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { CareIntakeModal } from "@/components/care-matching/CareIntakeModal";

export function CareIntakeApplyButton({
  className,
  children = "우리아이 안심입소 신청",
}: {
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:min-w-[15rem]"
        }
      >
        {children}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
      <CareIntakeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
