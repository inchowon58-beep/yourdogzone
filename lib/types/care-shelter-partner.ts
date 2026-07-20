export type ShelterPartnerStatus = "pending" | "approved" | "rejected";

export type CareShelterPartner = {
  id: string;
  shelter_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  password_hash: string;
  status: ShelterPartnerStatus;
  created_at: string;
  updated_at: string;
};

export type CareShelterPartnerInsert = {
  shelter_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  password: string;
};

export type CareShelterBid = {
  id: string;
  application_id: string;
  partner_id: string;
  amount: number;
  created_at: string;
};

export type CareShelterNotification = {
  id: string;
  partner_id: string;
  type: "new_matching" | "matching_closed" | "matched";
  title: string;
  body: string;
  application_id: string | null;
  read_at: string | null;
  created_at: string;
};
