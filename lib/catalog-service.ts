import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { CatalogData, Category } from "./catalog-types";

const CATALOG_CACHE_KEY = "@cerad_catalog_data";
const FAVORITES_KEY = "@cerad_favorites";

// S3 catalog.json URL (uploaded via storagePut)
const CATALOG_S3_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663337257885/g9FMjJFMH7rkmYiPvT29tr/cerad-catalog/catalog.json";

function getApiBaseUrl(): string {
  if (Platform.OS === "web") {
    const origin = window.location.origin;
    if (origin.includes("8081-")) {
      return origin.replace("8081-", "3000-");
    }
    return origin.replace(/:\d+$/, ":3000");
  }
  return "http://localhost:3000";
}

export function getImageUrl(catalogData: CatalogData, pageNum: number): string {
  // Prefer S3 URLs (imageUrls) over Google Drive IDs (imageIds)
  if (catalogData.imageUrls) {
    const url = catalogData.imageUrls[String(pageNum)];
    if (url) return url;
  }

  // Fallback to Google Drive via server proxy
  const fileId = catalogData.imageIds[String(pageNum)];
  if (!fileId) return "";

  if (Platform.OS === "web") {
    return `${getApiBaseUrl()}/api/image-proxy/${fileId}`;
  }
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
}

async function fetchFromS3(): Promise<CatalogData> {
  const response = await fetch(CATALOG_S3_URL + "?t=" + Date.now(), {
    method: "GET",
    headers: { Accept: "application/json", "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw new Error(`S3 error: ${response.status}`);
  return response.json();
}

async function fetchFromServer(): Promise<CatalogData> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/trpc/catalog.getData`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  const json = await response.json();
  return json.result?.data?.json ?? json.result?.data ?? json;
}

export async function fetchCatalogData(): Promise<CatalogData> {
  try {
    let data: CatalogData;

    // Try S3 first (fastest, no CORS issues)
    try {
      data = await fetchFromS3();
    } catch {
      // Fallback to server API
      try {
        data = await fetchFromServer();
      } catch {
        throw new Error("All data sources failed");
      }
    }

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
