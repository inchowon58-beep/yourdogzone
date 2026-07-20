import Link from "next/link";
import { CareShelterPartnerPortal } from "@/components/care-matching/CareShelterPartnerPortal";

export const metadata = {
  title: "회원가입",
};

export default function SignupPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-muted hover:text-primary">
        ← 홈으로
      </Link>
      <h1 className="mt-3 text-2xl font-black text-foreground">
        보호소 파트너 회원가입
      </h1>
      <p className="mt-2 text-sm text-muted">
        가입 후 관리자 승인이 완료되면 로그인하여 매칭에 참여할 수 있습니다.
      </p>
      <div className="mt-6">
        <CareShelterPartnerPortal initialMode="register" />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          로그인
        </Link>
      </p>
    </main>
  );
}
