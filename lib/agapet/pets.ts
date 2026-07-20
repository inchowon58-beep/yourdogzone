export type AgapetPetStatus = "waiting" | "adopted" | "hidden";

export type AgapetPet = {
  id: string;
  name: string;
  age: string;
  gender: "male" | "female" | string;
  species: string;
  status: AgapetPetStatus;
  photoUrl: string | null;
  href: string;
};

const SANITY_PROJECT_ID = "58cgd16k";
const SANITY_DATASET = "production";
const SANITY_API = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${SANITY_DATASET}`;
const AGAPET_ORIGIN = "https://www.agapetstory.co.kr";

type SanityPetRow = {
  _id: string;
  name?: string | null;
  age?: string | null;
  gender?: string | null;
  species?: string | null;
  status?: string | null;
  photoUrl?: string | null;
  _updatedAt?: string | null;
};

function cropPhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}w=640&h=640&fit=crop`;
}

function mapPet(row: SanityPetRow): AgapetPet {
  const id = row._id;
  return {
    id,
    name: (row.name ?? "").trim() || "이름 미정",
    age: (row.age ?? "").trim(),
    gender: row.gender ?? "",
    species: (row.species ?? "").trim(),
    status: (row.status as AgapetPetStatus) || "waiting",
    photoUrl: cropPhotoUrl(row.photoUrl),
    href: `${AGAPET_ORIGIN}/pets/${id}`,
  };
}

async function queryPets(groq: string): Promise<SanityPetRow[]> {
  const url = `${SANITY_API}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url, {
    next: { revalidate: 1800 },
  });
  if (!res.ok) {
    throw new Error(`Agapet Sanity query failed: ${res.status}`);
  }
  const json = (await res.json()) as { result?: SanityPetRow[] };
  return Array.isArray(json.result) ? json.result : [];
}

/**
 * 입양 가능(waiting) 우선 최대 12마리.
 * 12마리 미만이면 입양 완료(adopted)로 채움.
 */
export async function listAgapetPetsForHome(limit = 12): Promise<AgapetPet[]> {
  try {
    const rows = await queryPets(
      `*[_type=="pet" && status in ["waiting","adopted"]]{
        _id, name, age, gender, species, status, _updatedAt,
        "photoUrl": photo.asset->url
      } | order(_updatedAt desc)[0...80]`,
    );

    const waiting = rows
      .filter((r) => r.status === "waiting")
      .map(mapPet);
    const adopted = rows
      .filter((r) => r.status === "adopted")
      .map(mapPet);

    if (waiting.length >= limit) {
      return waiting.slice(0, limit);
    }
    return [...waiting, ...adopted].slice(0, limit);
  } catch {
    return [];
  }
}

export function formatAgapetGender(gender: string): string {
  if (gender === "female") return "여";
  if (gender === "male") return "남";
  return gender || "";
}

export function formatAgapetStatus(status: AgapetPetStatus): string {
  if (status === "waiting") return "입양 가능";
  if (status === "adopted") return "입양 완료";
  return "";
}

export const AGAPET_PETS_BOARD_URL = `${AGAPET_ORIGIN}/pets`;
