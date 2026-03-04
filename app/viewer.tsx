import { useEffect, useState, useRef, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCatalog } from "@/lib/catalog-context";
import { getImageUrl } from "@/lib/catalog-service";
import type { Category } from "@/lib/catalog-types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ViewerScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { catalogData } = useCatalog();

  const [currentIndex, setCurrentIndex] = useState(0);
  const mainListRef = useRef<FlatList>(null);
  const thumbListRef = useRef<FlatList>(null);

  const category = catalogData?.categories.find(
    (c: Category) => c.id === categoryId
  );

  const pages = category?.pages ?? [];

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index ?? 0;
        setCurrentIndex(idx);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  useEffect(() => {
    if (thumbListRef.current && pages.length > 0) {
      try {
        thumbListRef.current.scrollToIndex({
          index: currentIndex,
          animated: true,
          viewPosition: 0.5,
        });
      } catch {}
    }
  }, [currentIndex, pages.length]);

  const goToPage = useCallback(
    (index: number) => {
      if (mainListRef.current) {
        mainListRef.current.scrollToIndex({ index, animated: true });
      }
    },
    []
  );

  if (!catalogData || !category) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  const renderMainImage = ({ item: pageNum }: { item: number }) => {
    const url = getImageUrl(catalogData, pageNum);
    return (
      <View style={styles.mainImageWrapper}>
        <Image
          source={{ uri: url }}
          style={styles.mainImage}
          contentFit="contain"
          transition={150}
        />
      </View>
    );
  };

  const renderThumb = ({ item: pageNum, index }: { item: number; index: number }) => {
    const url = getImageUrl(catalogData, pageNum);
    const isActive = index === currentIndex;
    return (
      <Pressable
        onPress={() => goToPage(index)}
        style={({ pressed }) => [
          styles.thumbItem,
          isActive && { borderColor: "#FF6F00" },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Image
          source={{ uri: url }}
          style={styles.thumbImage}
          contentFit="cover"
          transition={100}
        />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backText}>목록</Text>
        </Pressable>
        <Text style={styles.catName} numberOfLines={1}>
          {category.name}
        </Text>
        <View style={styles.indicator}>
          <Text style={styles.indicatorText}>
            {currentIndex + 1} / {pages.length}
          </Text>
        </View>
      </View>

      {/* Thumbnail Strip */}
      <View style={styles.thumbStrip}>
        <FlatList
          ref={thumbListRef}
          data={pages}
          renderItem={renderThumb}
          keyExtractor={(item) => `thumb-${item}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbContent}
          getItemLayout={(_, index) => ({
            length: 60,
            offset: 60 * index,
            index,
          })}
        />
      </View>

      {/* Main Image Viewer */}
      <View style={styles.mainArea}>
        <FlatList
          ref={mainListRef}
          data={pages}
          renderItem={renderMainImage}
          keyExtractor={(item) => `page-${item}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
        />

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <Pressable
            onPress={() => goToPage(currentIndex - 1)}
            style={[styles.navArrow, styles.navLeft]}
          >
            <MaterialIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
        )}
        {currentIndex < pages.length - 1 && (
          <Pressable
            onPress={() => goToPage(currentIndex + 1)}
            style={[styles.navArrow, styles.navRight]}
          >
            <MaterialIcons name="chevron-right" size={28} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
  header: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  backBtn: {
    backgroundColor: "#333333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  catName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  indicator: {
    backgroundColor: "#333333",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  indicatorText: {
    color: "#999999",
    fontSize: 12,
  },
  thumbStrip: {
    backgroundColor: "#1A1A1A",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  thumbContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  thumbItem: {
    width: 54,
    height: 72,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  mainArea: {
    flex: 1,
    position: "relative",
  },
  mainImageWrapper: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
  navArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -30,
    width: 44,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  navLeft: {
    left: 10,
  },
  navRight: {
    right: 10,
  },
});
