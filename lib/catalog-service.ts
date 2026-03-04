import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CatalogData, Category } from "./catalog-types";

const CATALOG_JSON_ID = "1zy_0PRlXui0oEdM37qG0SjGBJpK8UfEE";
const CATALOG_CACHE_KEY = "@cerad_catalog_data";
const FAVORITES_KEY = "@cerad_favorites";

function gdriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

export function getImageUrl(catalogData: CatalogData, pageNum: number): string {
  const fileId = catalogData.imageIds[String(pageNum)];
  if (!fileId) return "";
  return gdriveDirectUrl(fileId);
}

export async function fetchCatalogData(): Promise<CatalogData> {
  try {
    const url = gdriveDirectUrl(CATALOG_JSON_ID);
    const response = await fetch(url);
    const text = await response.text();
    const data: CatalogData = JSON.parse(text);
    // Cache the data
    await AsyncStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    // Try to load from cache
    const cached = await AsyncStorage.getItem(CATALOG_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    throw error;
  }
}

export async function getCachedCatalogData(): Promise<CatalogData | null> {
  try {
    const cached = await AsyncStorage.getItem(CATALOG_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getFavorites(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(categoryId: string): Promise<string[]> {
  const favorites = await getFavorites();
  const index = favorites.indexOf(categoryId);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(categoryId);
  }
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorites;
}

export function searchCategories(
  categories: Category[],
  query: string
): Category[] {
  if (!query.trim()) return categories;
  const q = query.toLowerCase();
  return categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(q) ||
      cat.name_en.toLowerCase().includes(q) ||
      cat.desc.toLowerCase().includes(q)
  );
}
