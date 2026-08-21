export const Colors = {
  primary: "#0B5D3B",
  primaryDark: "#06452C",
  primaryLight: "#DFF4E9",

  secondary: "#F4B400",
  secondaryLight: "#FFF4CC",

  background: "#F5F7F6",
  surface: "#FFFFFF",

  text: "#17201B",
  textSecondary: "#68736D",
  textLight: "#9AA39E",

  border: "#E2E8E4",

  success: "#198754",
  successLight: "#E5F6ED",

  warning: "#F59E0B",
  warningLight: "#FFF4D6",

  danger: "#DC3545",
  dangerLight: "#FDE8EA",

  info: "#2563EB",
  infoLight: "#E8F0FF",

  white: "#FFFFFF",
  black: "#000000",

  transparent: "transparent",
} as const;

export type ColorKey = keyof typeof Colors;