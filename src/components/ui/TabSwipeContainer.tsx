import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { PropsWithChildren, useMemo } from "react";
import {
    PanResponder,
    PanResponderGestureState,
    StyleSheet,
    View,
} from "react-native";

const TAB_ROUTES = [
  "/(main)",
  "/(main)/customers",
  "/(main)/invoices",
  "/(main)/products",
  "/(main)/more",
] as const;

const SWIPE_ACTIVATION_DISTANCE = 8;
const SWIPE_DISTANCE_THRESHOLD = 48;
const SWIPE_VELOCITY_THRESHOLD = 0.18;

type TabRoute = (typeof TAB_ROUTES)[number];

interface TabSwipeContainerProps extends PropsWithChildren {
  currentRoute: TabRoute;
}

function getSwipeOffset(gesture: PanResponderGestureState): -1 | 1 | null {
  const absDx = Math.abs(gesture.dx);
  if (absDx < SWIPE_ACTIVATION_DISTANCE) return null;

  const shouldGoNext =
    gesture.dx < -SWIPE_DISTANCE_THRESHOLD ||
    gesture.vx < -SWIPE_VELOCITY_THRESHOLD;
  const shouldGoPrev =
    gesture.dx > SWIPE_DISTANCE_THRESHOLD ||
    gesture.vx > SWIPE_VELOCITY_THRESHOLD;

  if (shouldGoNext) return 1;
  if (shouldGoPrev) return -1;
  return null;
}

export function TabSwipeContainer({
  currentRoute,
  children,
}: TabSwipeContainerProps) {
  const router = useRouter();
  const currentIndex = TAB_ROUTES.indexOf(currentRoute);

  const shouldCaptureMove = (gesture: PanResponderGestureState) => {
    if (gesture.numberActiveTouches > 1) return false;
    const absDx = Math.abs(gesture.dx);
    const absDy = Math.abs(gesture.dy);
    return absDx > SWIPE_ACTIVATION_DISTANCE && absDx > absDy * 1.05;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => shouldCaptureMove(gesture),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          shouldCaptureMove(gesture),
        onPanResponderTerminationRequest: () => true,
        onPanResponderRelease: (_, gesture) => {
          const offset = getSwipeOffset(gesture);
          if (!offset || currentIndex < 0) return;

          const nextIndex = currentIndex + offset;
          if (nextIndex < 0 || nextIndex >= TAB_ROUTES.length) return;

          const nextRoute = TAB_ROUTES[nextIndex];
          void Haptics.selectionAsync();
          router.replace(nextRoute as any);
        },
      }),
    [currentIndex, router],
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
