// Portiert aus: lib/features/recipe/data/datasources/recipe_datasource.dart
// und lib/features/recipe/presentation/providers/generate_recipe_provider.dart

import { databases, storage, APPWRITE_CONFIG, ID, Query } from "./appwrite";
import { Recipe, Ingredient } from "@/types";

const { databaseId, collections, storageBucket } = APPWRITE_CONFIG;

// ============================================================
// Rezepte CRUD
// ============================================================

export async function saveRecipe(
  recipe: Recipe,
  userId: string
): Promise<Recipe> {
  const doc = await databases.createDocument(
    databaseId,
    collections.recipes,
    ID.unique(),
    {
      dishName: recipe.dishName,
      cuisine: recipe.cuisine,
      description: recipe.description,
      instructions: recipe.instructions,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      difficulty: recipe.difficulty,
      rating: recipe.rating || 0,
      recipeImages: recipe.recipeImages,
      userId,
    }
  );

  // Zutaten separat speichern (wie im Flutter-Code)
  for (const ingredient of recipe.ingredients) {
    await databases.createDocument(
      databaseId,
      collections.ingredients,
      ID.unique(),
      {
        recipeId: doc.$id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        notes: ingredient.notes || "",
      }
    );
  }

  return { ...recipe, id: doc.$id };
}

export async function getUserRecipes(userId: string): Promise<Recipe[]> {
  const response = await databases.listDocuments(
    databaseId,
    collections.recipes,
    [Query.equal("userId", userId), Query.orderDesc("$createdAt")]
  );

  const recipes: Recipe[] = [];
  for (const doc of response.documents) {
    const ingredients = await getRecipeIngredients(doc.$id);
    recipes.push({
      id: doc.$id,
      dishName: doc.dishName,
      cuisine: doc.cuisine,
      description: doc.description,
      ingredients,
      instructions: doc.instructions || [],
      servings: doc.servings,
      prepTime: doc.prepTime,
      cookTime: doc.cookTime,
      difficulty: doc.difficulty,
      rating: doc.rating,
      recipeImages: doc.recipeImages || [],
      userId: doc.userId,
      createdAt: doc.$createdAt,
    });
  }

  return recipes;
}

export async function getRecipeIngredients(
  recipeId: string
): Promise<Ingredient[]> {
  const response = await databases.listDocuments(
    databaseId,
    collections.ingredients,
    [Query.equal("recipeId", recipeId)]
  );

  return response.documents.map((doc) => ({
    name: doc.name,
    quantity: doc.quantity,
    unit: doc.unit,
    category: doc.category || "other",
    notes: doc.notes,
    isSelected: false,
  }));
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  // Erst Zutaten löschen
  const ingredients = await databases.listDocuments(
    databaseId,
    collections.ingredients,
    [Query.equal("recipeId", recipeId)]
  );
  for (const doc of ingredients.documents) {
    await databases.deleteDocument(databaseId, collections.ingredients, doc.$id);
  }
  // Dann Rezept löschen
  await databases.deleteDocument(databaseId, collections.recipes, recipeId);
}

// ============================================================
// Bild-Upload
// ============================================================

export async function uploadRecipeImage(file: File): Promise<string> {
  const result = await storage.createFile(storageBucket, ID.unique(), file);
  return result.$id;
}

export function getImageUrl(fileId: string): string {
  return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${storageBucket}/files/${fileId}/view?project=${APPWRITE_CONFIG.projectId}`;
}
