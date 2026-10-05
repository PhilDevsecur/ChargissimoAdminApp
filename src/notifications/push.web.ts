// Web (npm run web, dev uniquement) : pas de notifications push.
// Metro choisit push.ts sur iOS/Android.
export async function registerForPush(): Promise<void> {}
export async function unregisterForPush(): Promise<void> {}
