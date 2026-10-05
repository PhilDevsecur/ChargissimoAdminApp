// Web (npm run web, dev uniquement) : pas de notifications push dans le navigateur.
// Metro choisit PushBridge.tsx sur iOS/Android.
export function PushBridge() {
  return null;
}
