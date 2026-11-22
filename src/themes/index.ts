export type CdlTheme = "fi" | "metro" | "ac" | "compass" | "mckesson" | "novartis" | "apotex"

export interface CdlThemeMeta {
  id: CdlTheme
  label: string
}

export const CDL_THEMES: readonly CdlThemeMeta[] = [
  { id: "fi", label: "Fi" },
  { id: "metro", label: "Metro" },
  { id: "ac", label: "AC" },
  { id: "compass", label: "Compass" },
  { id: "mckesson", label: "McKesson" },
  { id: "novartis", label: "Novartis" },
  { id: "apotex", label: "Apotex" },
] as const
