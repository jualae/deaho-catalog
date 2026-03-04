import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CatalogData, Category } from "./catalog-types";
import {
  fetchCatalogData,
  getCachedCatalogData,
  getFavorites,
  toggleFavorite as toggleFav,
} from "./catalog-service";

interface CatalogContextType {
  catalogData: CatalogData | null;
  loading: boolean;
  error: string | null;
  favorites: string[];
  refreshData: () => Promise<void>;
  toggleFavorite: (pageId: string) => Promise<void>;
  isFavorite: (pageId: string) => boolean;
}

const CatalogContext = createContext<CatalogContextType>({
  catalogData: null,
  loading: true,
  error: null,
  favorites: [],
  refreshData: async () => {},
  toggleFavorite: async () => {},
  isFavorite: () => false,
});

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [catalogData, setCatalogData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Always fetch fresh data from S3 first
      const fresh = await fetchCatalogData();
      setCatalogData(fresh);
    } catch (err: any) {
      // Fallback to cache on error
      try {
        const cached = await getCachedCatalogData();
        if (cached) {
          setCatalogData(cached);
        } else {
          setError("카탈로그 데이터를 불러올 수 없습니다.");
        }
      } catch {
        setError("카탈로그 데이터를 불러올 수 없습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    const favs = await getFavorites();
    setFavorites(favs);
  }, []);

  useEffect(() => {
    loadData();
    loadFavorites();
  }, [loadData, loadFavorites]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const handleToggleFavorite = useCallback(async (pageId: string) => {
    const updated = await toggleFav(pageId);
    setFavorites(updated);
  }, []);

  const isFavorite = useCallback(
    (pageId: string) => favorites.includes(pageId),
    [favorites]
  );

  return (
    <CatalogContext.Provider
      value={{
        catalogData,
        loading,
        error,
        favorites,
        refreshData,
        toggleFavorite: handleToggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  return useContext(CatalogContext);
}
