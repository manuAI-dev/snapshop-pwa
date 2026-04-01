// Portiert aus: lib/core/shared/controllers/appwrite_*.dart
// Appwrite Collection IDs aus constants.dart

import { Client, Account, Databases, Storage, ID, Query } from "appwrite";

// Appwrite Konfiguration (bestehende IDs aus Flutter-Code)
export const APPWRITE_CONFIG = {
  endpoint:
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId:
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "67e7a5cf003e7712aa16",
  databaseId: "67e843420006d27bd6a6",
  collections: {
    recipes: "67e91ea9001d39478a09",
    users: "67e91f560003bcbcbd1c",
    ingredients: "6822f16000121bfeb60c",
    shoppingList: "shoppinglist",
  },
  storageBucket: "68243a3e001d8dcad03e",
} as const;

// Client initialisieren
const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// Services exportieren
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { client, ID, Query };
