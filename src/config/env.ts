export const env = {
  /** Racine du backend Chargissimo (sans slash final). */
  API_URL: (process.env.EXPO_PUBLIC_API_URL ?? 'https://chargissimo.com').replace(/\/+$/, ''),
  IS_DEV: __DEV__,
};
