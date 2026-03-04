import {
  Text,
  View,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { CategoryCard } from "@/components/category-card";
import { useCatalog } from "@/lib/catalog-context";
import { LinearGradient } from "expo-linear-gradient";
import type { Category } from "@/lib/catalog-types";

const isWeb = Platform.OS === "web";
const MOBILE_COLUMN_COUNT = 2;
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;

export default function HomeScreen() {
  const router = useRouter();
  const { catalogData, loading, error, refreshData } = useCatalog();
  const { width: windowWidth } = useWindowDimensions();

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: "/viewer",
      params: { categoryId: category.id },
    } as any);
  };

  /* ---- Shared header ---- */
  const ListHeader = () => (
    <View>
      <View style={styles.headerBar}>
        <View style={styles.headerLogo}>
          <Text style={styles.headerLogoText}>CO</Text>
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>CERAD · 대호상사</Text>
          <Text style={styles.headerSubtitle}>전문 미용 제품 카탈로그</Text>
        </View>
      </View>

      <LinearGradient
        colors={["#1A237E", "#283593", "#0D47A1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>CERAD CATALOG</Text>
        </View>
        <Text style={styles.heroTitle}>CERAD</Text>
        <Text style={styles.heroSubtitle}>
          대호상사 · Hair & Murin 전문 미용용품 종합 카탈로그
        </Text>
      </LinearGradient>

      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleText}>제품 카테고리</Text>
        <View style={styles.divider} />
      </View>
    </View>
  );

  /* ---- Loading / Error states ---- */
  if (loading && !catalogData) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A237E" />
          <Text style={styles.loadingText}>카탈로그 로딩 중...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error && !catalogData) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText}>인터넷 연결을 확인해 주세요.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const categories = catalogData?.categories ?? [];

  /* ============ WEB: ScrollView + CSS Grid ============ */
  if (isWeb) {
    return (
      <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        >
          <ListHeader />
          {/* Use data attribute for CSS Grid targeting */}
          <View
            // @ts-ignore - data attributes work on web
            dataSet={{ webGrid: "categories" }}
          >
            {categories.map((item) => (
              <View key={item.id}>
                <CategoryCard
                  category={item}
                  catalogData={catalogData!}
                  onPress={() => handleCategoryPress(item)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  /* ============ MOBILE: FlatList with fixed 2 columns ============ */
  const mobileCardWidth =
    (windowWidth - HORIZONTAL_PADDING * 2 - CARD_GAP) / MOBILE_COLUMN_COUNT;

  const renderCategory = ({ item, index }: { item: Category; index: number }) => {
    if (!catalogData) return null;
    return (
      <View
        style={[
          { width: mobileCardWidth },
          { marginRight: index % MOBILE_COLUMN_COUNT === 0 ? CARD_GAP : 0 },
        ]}
      >
        <CategoryCard
          category={item}
          catalogData={catalogData}
          onPress={() => handleCategoryPress(item)}
        />
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={MOBILE_COLUMN_COUNT}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshData}
            tintColor="#1A237E"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#757575",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginBottom: 8,
  },
  retryText: {
    fontSize: 14,
    color: "#757575",
  },
  headerBar: {
    backgroundColor: "#1A237E",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerLogo: {
    width: 42,
    height: 42,
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogoText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A237E",
    letterSpacing: -1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  hero: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
  },
  heroBadge: {
    backgroundColor: "#FF6F00",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  sectionTitle: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 24,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitleText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A237E",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: CARD_GAP,
  },
});
