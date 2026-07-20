import Link from "next/link";
import { CareIntakeMyPortal } from "@/components/care-matching/CareIntakeMyPortal";

export const metadata = {
  title: "나의 안심입소 신청내역",
};

export default function CareIntakeMyPage() {
  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className="text-sm text-muted hover:text-primary">
        ← 홈으로
      </Link>
      <h1 className="mt-3 text-2xl font-black text-foreground sm:text-3xl">
        나의 안심입소 신청내역
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted sm:text-base">
        신청 시 설정한 비밀번호로 제안 현황을 확인하고 매칭·딜리버리·입소취소를
        진행할 수 있습니다.
      </p>
      <div className="mt-6 w-full min-w-0 sm:mt-8">
        <CareIntakeMyPortal />
      </div>
    </main>
  );
}
