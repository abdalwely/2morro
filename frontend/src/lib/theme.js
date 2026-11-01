import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const DEFAULT_DARK = "#070D1B";
const DEFAULT_PRIMARY = "#0066FF";
const NAVY_DEFAULT = { 900: "7 13 27", 800: "10 25 47", 700: "17 34 64", 600: "27 58 107", 500: "42 78 143" };
const SPEED = { slow: 1.6, normal: 1, fast: 0.5 };

function hexToRgb(hex) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(rgb, target, w) {
  return rgb.map((c, i) => Math.round(c + (target[i] - c) * w));
}

const str = (rgb) => rgb.join(" ");
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

function colorVars(colors = {}) {
  const p = hexToRgb(colors.primary || DEFAULT_PRIMARY);
  const d = hexToRgb(colors.dark || DEFAULT_DARK);
  const isDefaultDark = (colors.dark || DEFAULT_DARK).toUpperCase() === DEFAULT_DARK;
  const navy = isDefaultDark
    ? NAVY_DEFAULT
    : { 900: str(d), 800: str(mix(d, WHITE, 0.05)), 700: str(mix(d, WHITE, 0.11)), 600: str(mix(d, WHITE, 0.22)), 500: str(mix(d, WHITE, 0.32)) };
  return {
    "--c-electric": str(p),
    "--c-electric-600": str(mix(p, BLACK, 0.2)),
    "--c-electric-100": str(mix(p, WHITE, 0.86)),
    "--c-electric-50": str(mix(p, WHITE, 0.94)),
    "--c-aqua": str(hexToRgb(colors.accent || "#00E5FF")),
    "--c-surface": str(hexToRgb(colors.surface || "#F8FAFC")),
    "--c-page": str(hexToRgb(colors.page || "#F7F9FC")),
    ...Object.fromEntries(Object.entries(navy).map(([k, v]) => [`--c-navy-${k}`, v])),
  };
}

export function applyTheme(theme, isAdmin = false) {
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(colorVars(theme.colors)).forEach(([k, v]) => root.style.setProperty(k, v));
  const anim = theme.animations || {};
  const deco = theme.decorations || {};
  root.style.setProperty("--anim-mult", String(SPEED[anim.speed] || 1));
  root.classList.toggle("anim-off", !isAdmin && anim.enabled === false);
  root.classList.toggle("no-grid", !isAdmin && deco.grid === false);
  root.classList.toggle("no-glow", !isAdmin && deco.glow === false);
}

export function bootTheme() {
  try {
    applyTheme(JSON.parse(window.localStorage.getItem("site_theme") || "null"), window.location.pathname.startsWith("/admin"));
  } catch (error) {
    console.error("Failed to apply cached theme", error);
  }
}

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then((r) => r.data), staleTime: 5 * 60 * 1000 });
}

export function ThemeApplier() {
  const { data: settings } = useSettings();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  useEffect(() => {
    if (!settings?.theme) return;
    applyTheme(settings.theme, isAdmin);
    window.localStorage.setItem("site_theme", JSON.stringify(settings.theme));
  }, [settings, isAdmin]);
  return null;
}
