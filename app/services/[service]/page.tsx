import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";

const SERVICE_META: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  adoption: {
    title: "강아지분양",
    description: "윤리적 강아지 분양 정보 및 매칭 — 전국 지역별 분양 안내.",
    keywords: ["강아지분양", "강아지 입양", "반려견 분양"],
  },
  shelter: {
    title: "강아지보호소",
    description: "유기견·구조견 보호소 정보 — 지역별 보호소 검색.",
    keywords: ["강아지보호소", "유기견", "구조견"],
  },
  funeral: {
    title: "강아지장례식장",
    description: "반려견 장례식장 정보 및 예약 안내.",
    keywords: ["강아지장례", "반려견 장례식장"],
  },
  breeder: {
    title: "브리더정보",
    description: "인증 브리더 리스트 및 견종별 브리더 정보.",
    keywords: ["브리더", "견종 브리더", "강아지 브리더"],
  },
  hospital: {
    title: "동물병원",
    description: "위치 기반 동물병원 조회 — 지역별 반려동물 병원 정보.",
    keywords: ["동물병원", "반려동물 병원", "24시 동물병원"],
  },
};

type PageProps = {
  params: Promise<{ service: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service } = await params;
  const meta = SERVICE_META[service];
  if (!meta) {
    return { title: "서비스" };
  }

  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: `/services/${service}`,
    keywords: meta.keywords,
  });
}

export default async function ServicePage({ params }: PageProps) {
  const { service } = await params;
  const meta = SERVICE_META[service];

  if (!meta) {
    return (
      <main className="w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <p>서비스를 찾을 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
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

      <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-[var(--card-shadow)] sm:p-12">
        <p className="text-muted">리스트 데이터 연동 준비 중입니다.</p>
      </div>
    </main>
  );
}
