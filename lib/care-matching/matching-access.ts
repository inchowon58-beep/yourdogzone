import "server-only";

import { isMainAdminAuthenticated } from "@/lib/admin/main-auth";
import {
  getShelterPartnerById,
  sanitizeShelterPartner,
} from "@/lib/care-matching/partner-queries";
import { getShelterPartnerIdFromSession } from "@/lib/care-matching/shelter-auth";
import type { CareShelterPartner } from "@/lib/types/care-shelter-partner";

export type CareMatchingViewer = {
  isAdmin: boolean;
  isPartner: boolean;
  canViewPhotos: boolean;
  canBid: boolean;
  partnerId: string | null;
  partner: Omit<CareShelterPartner, "password_hash"> | null;
};

export async function getCareMatchingViewer(): Promise<CareMatchingViewer> {
  const isAdmin = await isMainAdminAuthenticated();
  const partnerIdFromCookie = await getShelterPartnerIdFromSession();

  let partner: CareShelterPartner | null = null;
  if (partnerIdFromCookie) {
    partner = await getShelterPartnerById(partnerIdFromCookie);
    if (partner && partner.status !== "approved") {
      partner = null;
    }
  }

  const isPartner = Boolean(partner);
  const partnerId = partner?.id ?? null;

  return {
    isAdmin,
    isPartner,
    canViewPhotos: isAdmin || isPartner,
    canBid: isPartner,
    partnerId,
    partner: partner ? sanitizeShelterPartner(partner) : null,
  };
}
