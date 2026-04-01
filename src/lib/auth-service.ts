// Portiert aus: lib/features/auth/data/datasources/auth_datasource.dart
// und lib/core/shared/controllers/appwrite_auth_service.dart

import { account, databases, APPWRITE_CONFIG, ID } from "./appwrite";
import { User } from "@/types";

const { databaseId, collections } = APPWRITE_CONFIG;

// ============================================================
// Authentifizierung
// ============================================================

export async function register(
  email: string,
  password: string,
  name: string
): Promise<User> {
  // Appwrite Account erstellen
  const appwriteUser = await account.create(ID.unique(), email, password, name);

  // Session erstellen (einloggen)
  await account.createEmailPasswordSession(email, password);

  // User-Dokument in DB erstellen
  await databases.createDocument(
    databaseId,
    collections.users,
    appwriteUser.$id,
    {
      name,
      email,
      phone: "",
      profilePicture: "",
    }
  );

  return {
    id: appwriteUser.$id,
    name,
    email,
    createdAt: appwriteUser.$createdAt,
  };
}

export async function login(email: string, password: string): Promise<User> {
  await account.createEmailPasswordSession(email, password);
  return getCurrentUser();
}

export async function logout(): Promise<void> {
  await account.deleteSession("current");
}

export async function getCurrentUser(): Promise<User> {
  const appwriteUser = await account.get();

  // User-Dokument aus DB holen
  try {
    const userDoc = await databases.getDocument(
      databaseId,
      collections.users,
      appwriteUser.$id
    );

    return {
      id: appwriteUser.$id,
      name: userDoc.name || appwriteUser.name,
      email: appwriteUser.email,
      phone: userDoc.phone,
      profilePicture: userDoc.profilePicture,
      createdAt: appwriteUser.$createdAt,
    };
  } catch {
    // Falls kein DB-Dokument existiert, nur Appwrite-Account-Daten zurückgeben
    return {
      id: appwriteUser.$id,
      name: appwriteUser.name,
      email: appwriteUser.email,
      createdAt: appwriteUser.$createdAt,
    };
  }
}

export async function resetPassword(email: string): Promise<void> {
  await account.createRecovery(
    email,
    `${window.location.origin}/reset-password`
  );
}

export async function updateProfile(
  userId: string,
  data: Partial<Pick<User, "name" | "phone" | "profilePicture">>
): Promise<void> {
  await databases.updateDocument(databaseId, collections.users, userId, data);
}
