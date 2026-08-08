import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold
} from '@expo-google-fonts/instrument-sans';

export const appFonts = {
  family: 'DM Sans',
  faces: {
    regular: 'InstrumentSans_400Regular',
    medium: 'InstrumentSans_500Medium',
    semiBold: 'InstrumentSans_600SemiBold',
    bold: 'InstrumentSans_700Bold'
  }
} as const;

export type AppFontFace = (typeof appFonts.faces)[keyof typeof appFonts.faces];

export const appFontAssets = {
  [appFonts.faces.regular]: InstrumentSans_400Regular,
  [appFonts.faces.medium]: InstrumentSans_500Medium,
  [appFonts.faces.semiBold]: InstrumentSans_600SemiBold,
  [appFonts.faces.bold]: InstrumentSans_700Bold
};
