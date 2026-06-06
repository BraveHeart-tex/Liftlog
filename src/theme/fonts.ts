import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold
} from '@expo-google-fonts/dm-sans';

export const appFonts = {
  family: 'DM Sans',
  faces: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold'
  }
} as const;

export type AppFontFace = (typeof appFonts.faces)[keyof typeof appFonts.faces];

export const appFontAssets = {
  [appFonts.faces.regular]: DMSans_400Regular,
  [appFonts.faces.medium]: DMSans_500Medium,
  [appFonts.faces.semiBold]: DMSans_600SemiBold,
  [appFonts.faces.bold]: DMSans_700Bold
};
