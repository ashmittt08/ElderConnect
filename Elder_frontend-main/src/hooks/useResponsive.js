import { useWindowDimensions } from "react-native";

/**
 * Returns responsive layout info based on current window width.
 *
 * Breakpoints:
 *   mobile:  < 600px
 *   tablet:  600–1023px
 *   desktop: >= 1024px
 */
export default function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;
  const showSidebar = width >= 768;
  const showBottomBar = width < 768;

  // Number of stat card columns
  const statColumns = isMobile ? 1 : isTablet ? 2 : 4;
  // Chart grid: side-by-side on desktop, stacked otherwise
  const chartRow = isDesktop;
  // Padding scales with size
  const contentPadding = isMobile ? 16 : isTablet ? 22 : 28;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    showSidebar,
    showBottomBar,
    statColumns,
    chartRow,
    contentPadding,
  };
}
