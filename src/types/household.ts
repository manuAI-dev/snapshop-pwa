// SnapShop Multi-User / Haushalt Types

export interface HouseholdProfile {
  adults: number;
  children: number;
  dietary: string[];
  allergies: string[];
  cookingTimeWeekday: number; // Minuten
  cookingTimeWeekend: number; // Minuten
}

export interface Household {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  // Familienplaner-Profil
  profile: HouseholdProfile;
}

export const DIETARY_OPTIONS = [
  "Vegetarisch",
  "Vegan",
  "Pescetarisch",
  "Laktosefrei",
  "Glutenfrei",
  "Low Carb",
  "Halal",
  "Koscher",
] as const;

export const ALLERGY_OPTIONS = [
  "Nüsse",
  "Gluten",
  "Laktose",
  "Eier",
  "Soja",
  "Fisch",
  "Schalentiere",
  "Sellerie",
  "Senf",
  "Sesam",
] as const;

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
  // Joined from profile
  name?: string;
  email?: string;
  profileImage?: string;
}

export interface HouseholdInvite {
  id: string;
  householdId: string;
  email: string | null;
  invitedBy: string;
  token: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
  expiresAt: string;
}
