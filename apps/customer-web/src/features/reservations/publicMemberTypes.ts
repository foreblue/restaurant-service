export interface PublicMember {
  id: number;
  name: string;
  phoneLast4: string;
  email: string;
  allergyNote: string | null;
  anniversaryType: string | null;
  anniversaryDate: string | null;
  marketingOptIn: boolean;
}

export interface PublicMemberListResponse {
  members: PublicMember[];
}
