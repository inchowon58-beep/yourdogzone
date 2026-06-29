import { createSupabaseClient } from "@/lib/supabase/client";

export type LandingPageEntry = {
  slug: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  updated_at?: string | null;
};

export async function getLandingPages(): Promise<LandingPageEntry[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("landing_pages")
    .select("slug, title, subtitle, body, updated_at")
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data as LandingPageEntry[];
}

export async function getLandingPageSlugs(): Promise<string[]> {
  const pages = await getLandingPages();
  return pages.map((page) => page.slug);
}
