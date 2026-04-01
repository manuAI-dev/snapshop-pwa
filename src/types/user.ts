// Portiert aus: lib/core/shared/models/user_model.dart

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  countryCode?: string;
  createdAt?: string;
  householdId?: string;
  householdRole?: "owner" | "member";
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}
