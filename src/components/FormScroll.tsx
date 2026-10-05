import { useEffect, useState } from 'react';
import { Keyboard, Platform, ScrollView, type ScrollViewProps } from 'react-native';

/**
 * Hauteur du clavier à l'écran (0 s'il est fermé).
 *
 * iOS annonce l'ouverture AVANT l'animation (`keyboardWillShow`), Android seulement
 * après (`keyboardDidShow`) — d'où les deux jeux d'événements.
 */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}

/**
 * ScrollView de formulaire : le contenu reste atteignable quand le clavier est ouvert.
 *
 * ⚠️ Pourquoi ce composant (signalé le 2026-09-26 : « le bouton de validation est
 * inaccessible, même en scrollant ») :
 *  - **Android** : `edgeToEdgeEnabled` est activé (défaut du SDK 54, cf. app.json) et,
 *    dans ce mode, la fenêtre NE SE REDIMENSIONNE PLUS à l'ouverture du clavier. Le
 *    ScrollView ne gagne donc aucune hauteur à faire défiler et le bas du formulaire
 *    reste sous le clavier. On ajoute nous-mêmes un padding égal à sa hauteur.
 *  - **iOS** : `automaticallyAdjustKeyboardInsets` fait le travail nativement (et tient
 *    compte de la barre de navigation), donc PAS de padding maison — sinon on décale
 *    deux fois. C'est aussi plus fiable qu'un `KeyboardAvoidingView` dont le
 *    `keyboardVerticalOffset` doit être calé à la main sur la hauteur de l'en-tête.
 *  - `keyboardShouldPersistTaps="handled"` : sans lui, le premier appui sur un bouton
 *    ne fait que refermer le clavier — il faut appuyer deux fois.
 */
export function FormScroll({ contentContainerStyle, children, ...props }: ScrollViewProps) {
  const keyboard = useKeyboardHeight();
  const extraBottom = Platform.OS === 'android' ? keyboard : 0;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      contentContainerStyle={[contentContainerStyle, extraBottom ? { paddingBottom: extraBottom + 24 } : null]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
