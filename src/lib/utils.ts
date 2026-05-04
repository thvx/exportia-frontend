import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Maps the first 2 digits of an HS code to a WTO Timeseries SITC3 product group. */
export function hsToSitc3(hsCode: string): string {
  const ch = parseInt(hsCode.slice(0, 2), 10);
  if (isNaN(ch)) return "TO";
  if (ch >= 1  && ch <= 24) return "AGFO";
  if (ch >= 25 && ch <= 27) return "MIFU";
  if (ch >= 28 && ch <= 38) return "MACH";
  if (ch >= 39 && ch <= 49) return "MA";
  if (ch >= 50 && ch <= 63) return "MAIS";
  if (ch >= 64 && ch <= 83) return "MAMT";
  if (ch >= 84 && ch <= 90) return "MACHPH";
  return "MA";
}

const FLAG_MAP: Record<string, string> = {
  // Americas
  "Canada": "🇨🇦", "United States": "🇺🇸", "United States of America": "🇺🇸", "USA": "🇺🇸",
  "Mexico": "🇲🇽", "México": "🇲🇽", "Chile": "🇨🇱",
  "Brazil": "🇧🇷", "Brasil": "🇧🇷", "Argentina": "🇦🇷",
  "Colombia": "🇨🇴", "Peru": "🇵🇪", "Perú": "🇵🇪", "Ecuador": "🇪🇨",
  "Bolivia": "🇧🇴", "Paraguay": "🇵🇾", "Uruguay": "🇺🇾", "Venezuela": "🇻🇪",
  "Costa Rica": "🇨🇷", "Panama": "🇵🇦", "Guatemala": "🇬🇹", "Honduras": "🇭🇳",
  "El Salvador": "🇸🇻", "Nicaragua": "🇳🇮", "Cuba": "🇨🇺", "Dominican Rep.": "🇩🇴",
  // Europe
  "Germany": "🇩🇪", "Alemania": "🇩🇪", "France": "🇫🇷", "Francia": "🇫🇷",
  "Spain": "🇪🇸", "España": "🇪🇸", "Italy": "🇮🇹", "Italia": "🇮🇹",
  "Netherlands": "🇳🇱", "Países Bajos": "🇳🇱", "Belgium": "🇧🇪", "Bélgica": "🇧🇪",
  "United Kingdom": "🇬🇧", "Reino Unido": "🇬🇧", "UK": "🇬🇧",
  "Switzerland": "🇨🇭", "Suiza": "🇨🇭", "Sweden": "🇸🇪", "Suecia": "🇸🇪",
  "Poland": "🇵🇱", "Austria": "🇦🇹", "Denmark": "🇩🇰", "Finland": "🇫🇮",
  "Norway": "🇳🇴", "Portugal": "🇵🇹", "Czech Rep.": "🇨🇿", "Romania": "🇷🇴",
  "Hungary": "🇭🇺", "Greece": "🇬🇷", "Russian Federation": "🇷🇺", "Russia": "🇷🇺",
  "Turkey": "🇹🇷", "Türkiye": "🇹🇷", "Ukraine": "🇺🇦",
  // Asia & Pacific
  "Japan": "🇯🇵", "Japón": "🇯🇵", "China": "🇨🇳",
  "Korea, Republic of": "🇰🇷", "Rep. of Korea": "🇰🇷", "South Korea": "🇰🇷", "Corea del Sur": "🇰🇷",
  "India": "🇮🇳", "Australia": "🇦🇺", "Vietnam": "🇻🇳", "Viet Nam": "🇻🇳",
  "Indonesia": "🇮🇩", "Thailand": "🇹🇭", "Malaysia": "🇲🇾", "Philippines": "🇵🇭",
  "Singapore": "🇸🇬", "New Zealand": "🇳🇿", "Taiwan": "🇹🇼",
  "Bangladesh": "🇧🇩", "Pakistan": "🇵🇰", "Sri Lanka": "🇱🇰",
  // Middle East & Africa
  "Saudi Arabia": "🇸🇦", "United Arab Emirates": "🇦🇪", "UAE": "🇦🇪",
  "Israel": "🇮🇱", "Iran": "🇮🇷", "Iraq": "🇮🇶", "Egypt": "🇪🇬",
  "South Africa": "🇿🇦", "Nigeria": "🇳🇬", "Ethiopia": "🇪🇹", "Etiopía": "🇪🇹",
  "Kenya": "🇰🇪", "Ghana": "🇬🇭", "Morocco": "🇲🇦", "Tanzania": "🇹🇿",
};

export function countryFlag(name: string): string {
  return FLAG_MAP[name] ?? "🌐";
}

/** Formats a raw USD value into a human-readable string. */
export function formatUsd(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)} B`;
  if (usd >= 1_000_000)     return `$${(usd / 1_000_000).toFixed(0)} M`;
  if (usd >= 1_000)         return `$${(usd / 1_000).toFixed(0)} K`;
  return `$${usd.toFixed(0)}`;
}
