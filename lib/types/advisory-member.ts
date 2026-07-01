export type AdvisoryMember = {
  id: string;
  sortOrder: number;
  isPublished: boolean;
  name: string;
  /** 예: 훈련/행정 부문 */
  category: string;
  /** 예: 한국애견연맹 훈련사 위원장 */
  title: string;
  description?: string;
  profilePhotoUrl?: string;
  kakaoUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdvisoryMemberInsert = Omit<
  AdvisoryMember,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};
