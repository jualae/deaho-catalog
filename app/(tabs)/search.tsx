import { useState, useMemo } from "react";
import {
  Text,
  View,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useCatalog } from "@/lib/catalog-context";
import { searchCategories, getImageUrl } from "@/lib/catalog-service";
import type { Category } from "@/lib/catalog-types";

export default function SearchScreen() {
  const router = useRouter();
  const { catalogData, toggleFavorite, isFavorite } = useCatalog();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!catalogData) return [];
    return searchCategories(catalogData.categories, query);
  }, [catalogData, query]);

  const handlePress = (category: Category) => {
    router.push({
      pathname: "/viewer",
      params: { categoryId: category.id },
    } as any);
  };

  const renderItem = ({ item }: { item: Category }) => {
    if (!catalogData) return null;
    const thumbUrl = getImageUrl(catalogData, item.pages[0]);

    return (
      <Pressable
        onPress={() => handlePress(item)}
        style={({ pressed }) => [
          styles.resultItem,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
      >
        <Image
          source={{ uri: thumbUrl }}
          style={styles.resultThumb}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.resultNameEn} numberOfLines={1}>
            {item.name_en}
          </Text>
          <Text style={styles.resultDesc} numberOfLines={2}>
            {item.desc}
          </Text>
          <Text style={styles.resultPages}>{item.pages.length}페이지</Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            toggleFavorite(item.id);
          }}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <MaterialIcons
            name={isFavorite(item.id) ? "favorite" : "favorite-border"}
            size={22}
            color={isFavorite(item.id) ? "#EF4444" : "#9CA3AF"}
          />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <View style={styles.searchHeader}>
        <Text style={styles.title}>검색</Text>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="카테고리명 또는 설명으로 검색"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            returnKeyType="done"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {results.length === 0 && query.length > 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>카테고리를 검색해 보세요</Text>
          <Text style={styles.emptySubtext}>
            제품명, 카테고리명, 설명으로 검색할 수 있습니다
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A237E",
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#212121",
    padding: 0,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  resultThumb: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#EEEEEE",
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212121",
  },
  resultNameEn: {
    fontSize: 10,
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  resultDesc: {
    fontSize: 12,
    color: "#757575",
    lineHeight: 17,
    marginTop: 4,
  },
  resultPages: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#D1D5DB",
    marginTop: 4,
    textAlign: "center",
  },
});
