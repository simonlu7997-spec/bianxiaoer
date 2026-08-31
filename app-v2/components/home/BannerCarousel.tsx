import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_HEIGHT = Math.round(SCREEN_WIDTH * (7 / 16));

interface BannerItem {
  id: string;
  /** 本地 require 资源（number）或远程 URL（string） */
  image: number | string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

interface BannerCarouselProps {
  banners: BannerItem[];
  autoPlayInterval?: number;
}

export function BannerCarousel({ banners, autoPlayInterval = 3000 }: BannerCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % banners.length;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  }, [currentIndex, banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(goToNext, autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [goToNext, autoPlayInterval, banners.length]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderItem = ({ item }: { item: BannerItem }) => (
    <Pressable
      style={styles.bannerItem}
      onPress={item.onPress}
    >
      <Image
        source={typeof item.image === "string" ? { uri: item.image } : item.image}
        style={styles.bannerImage}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.bannerSubtitle} numberOfLines={1}>{item.subtitle}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
      />
      {/* Dot indicators */}
      <View style={styles.dotsContainer}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                width: index === currentIndex ? 20 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    position: "relative",
  },
  bannerItem: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 12,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
