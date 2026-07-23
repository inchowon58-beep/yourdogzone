import Link from "next/link";
import { CareMatchingOpenListPaginated } from "@/components/care-matching/CareMatchingOpenListPaginated";
import { listOpenCareIntakes } from "@/lib/care-matching/queries";

export const revalidate = 300;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function CareMatchingListPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const openList = await listOpenCareIntakes({
    page,
    pageSize: 10,
    useCache: true,
  });

  return (
    <main className="mx-auto w-full px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted hover:text-primary">
          ← 홈으로
        </Link>
        <h1 className="mt-3 text-2xl font-black text-foreground">
          안심입소 매칭 리스트
        </h1>
        <p className="mt-2 text-sm text-muted">
          진행 중인 안심입소 신청입니다. 보호소 파트너 회원은 사진 확인 및
          돌봄비용을 제안할 수 있습니다.
        </p>
      </div>

      <CareMatchingOpenListPaginated
        initialPage={page}
        initialItems={openList.items}
        initialTotal={openList.total}
      />
    </main>
  );
}
