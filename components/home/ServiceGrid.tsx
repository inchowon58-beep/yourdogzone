import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SERVICES } from "@/lib/constants/services";

export function ServiceGrid() {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          핵심 서비스
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          반려견 생활에 필요한 모든 정보를 빠르게 찾아보세요
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <Link
              key={service.id}
              href={service.href}
              className="group flex flex-col rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)]"
            >
              <span
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${service.color}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <h3 className="font-semibold text-foreground">{service.title}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">
                {service.description}
              </p>
              <span className="mt-4 flex items-center gap-0.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                바로가기
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
