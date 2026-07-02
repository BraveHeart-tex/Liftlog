import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';

export const appFonts = {
  family: 'DM Sans',
  faces: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold'
  }
} as const;

export type AppFontFace = (typeof appFonts.faces)[keyof typeof appFonts.faces];

export const appFontAssets = {
  [appFonts.faces.regular]: Inter_400Regular,
  [appFonts.faces.medium]: Inter_500Medium,
  [appFonts.faces.semiBold]: Inter_600SemiBold,
  [appFonts.faces.bold]: Inter_700Bold
};
