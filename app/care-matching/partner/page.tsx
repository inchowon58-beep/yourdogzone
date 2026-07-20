import Link from "next/link";
import { CareShelterPartnerPortal } from "@/components/care-matching/CareShelterPartnerPortal";

export const metadata = {
  title: "보호소 파트너",
};

export default function CareShelterPartnerPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-muted hover:text-primary">
        ← 홈으로
      </Link>
      <h1 className="mt-3 text-2xl font-black text-foreground">
        보호소 파트너
      </h1>
      <p className="mt-2 text-sm text-muted">
        회원가입·로그인 후 안심입소 매칭에 돌봄비용을 제안하고 알림을 받을 수
        있습니다.
      </p>
      <div className="mt-6">
        <CareShelterPartnerPortal />
      </div>
    </main>
  );
}
