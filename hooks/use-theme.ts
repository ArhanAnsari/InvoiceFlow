// hooks/use-theme.ts
// Returns the resolved Color token set based on themeMode + system preference.
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useUIStore } from "@/src/store/uiStore";

/**
 * Returns `Colors.dark` or `Colors.light` depending on the user's
 * themeMode setting (dark / light / system).
 */
export function useTheme() {
  const { themeMode } = useUIStore();
  const systemScheme = useColorScheme();

  const isDark =
    themeMode === "dark" || (themeMode === "system" && systemScheme === "dark");

  return isDark ? Colors.dark : Colors.light;
}

/**
 * Returns true when the resolved theme is dark.
 */
export function useIsDark() {
  const { themeMode } = useUIStore();
  const systemScheme = useColorScheme();
  return (
    themeMode === "dark" || (themeMode === "system" && systemScheme === "dark")
  );
}
