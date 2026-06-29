import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SERVICE_META: Record<string, { title: string; description: string }> = {
  academy: { title: "애견미용학원", description: "전문 미용 교육 및 매칭" },
  adoption: { title: "강아지분양", description: "윤리적 분양 매칭" },
  shelter: { title: "강아지보호소", description: "유기견·구조견 정보" },
  funeral: { title: "강아지장례식장", description: "장례 정보 및 예약" },
  breeder: { title: "브리더정보", description: "인증 브리더 리스트" },
  hospital: { title: "동물병원", description: "위치 기반 병원 조회" },
};

type PageProps = {
  params: Promise<{ service: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service } = await params;
  const meta = SERVICE_META[service];
  return {
    title: meta?.title ?? "서비스",
    description: meta?.description ?? "유아독존 서비스",
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { service } = await params;
  const meta = SERVICE_META[service];

  if (!meta) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p>서비스를 찾을 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <h1 className="text-2xl font-bold">{meta.title}</h1>
      <p className="mt-2 text-muted">{meta.description}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {["전체", "서울", "경기", "인천", "부산"].map((region) => (
          <button
            key={region}
            type="button"
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-muted shadow-[var(--card-shadow)] transition-colors hover:text-primary first:bg-primary first:text-white"
          >
            {region}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-white p-12 text-center shadow-[var(--card-shadow)]">
        <p className="text-muted">리스트 데이터 연동 준비 중입니다.</p>
      </div>
    </main>
  );
}
