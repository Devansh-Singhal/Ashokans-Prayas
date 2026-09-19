import { TextStyle } from 'react-native';

const weights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

type Weight = (typeof weights)[keyof typeof weights];

function text(size: number, lineHeight: number, fontWeight: Weight, extra?: Partial<TextStyle>): TextStyle {
  return { fontSize: size, lineHeight, fontWeight, ...extra };
}

export const TYPOGRAPHY = {
  hero: text(44, 48, weights.black),
  stat: text(28, 32, weights.black),
  h1: text(24, 28, weights.black),
  h2: text(22, 26, weights.extrabold),
  h3: text(20, 24, weights.extrabold),
  h4: text(18, 22, weights.black),
  modalTitle: text(18, 24, weights.extrabold),
  title: text(16, 20, weights.extrabold),
  subtitle: text(14, 19, weights.bold),
  body: text(13, 19, weights.regular),
  bodyStrong: text(13, 19, weights.bold),
  bodySm: text(12, 18, weights.regular),
  bodySmStrong: text(12, 18, weights.bold),
  caption: text(11, 16, weights.regular),
  captionStrong: text(11, 16, weights.bold),
  micro: text(10, 14, weights.bold),
  microFaint: text(10, 14, weights.medium),
} as const;

export const CAPS_LABEL = {
  textTransform: 'uppercase',
  letterSpacing: 0.5,
} as const satisfies Partial<TextStyle>;

export const NUMERIC: Pick<TextStyle, 'fontVariant'> = {
  fontVariant: ['tabular-nums'],
};
