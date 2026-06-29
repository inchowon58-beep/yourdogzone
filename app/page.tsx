import { SearchBar } from "@/components/home/SearchBar";
import { ServiceGrid } from "@/components/home/ServiceGrid";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 md:pt-24">
        <div className="mb-16 flex flex-col items-center text-center">
          <p className="mb-4 text-sm font-semibold tracking-wide text-primary">
            반려동물 통합 포털
          </p>
          <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
            반려견과 함께하는
            <br />
            모든 정보, 유아독존
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            미용학원부터 분양, 보호소, 병원까지 — 필요한 서비스를 빠르게
            찾아보세요.
          </p>
          <div className="mt-10 w-full flex justify-center">
            <SearchBar />
          </div>
        </div>

        <ServiceGrid />
      </section>
    </main>
  );
}
