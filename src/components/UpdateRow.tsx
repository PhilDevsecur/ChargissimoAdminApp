import { useState } from 'react';
import { Platform } from 'react-native';
import { List, Text } from 'react-native-paper';
import * as Updates from 'expo-updates';

/**
 * Quelle mise à jour JS tourne réellement sur CE téléphone, et bouton pour aller
 * chercher la dernière tout de suite.
 *
 * Sans ça, impossible de savoir depuis le téléphone si une mise à jour EAS a été
 * appliquée : expo-updates télécharge en arrière-plan au lancement et n'applique
 * qu'au lancement SUIVANT — on a cru à une publication ratée le 2026-09-22 alors
 * que le téléphone tournait simplement encore sur la version précédente.
 */
export function UpdateRow() {
  const [state, setState] = useState<'idle' | 'checking' | 'none' | 'error'>('idle');

  const description = Updates.isEmbeddedLaunch
    ? 'Version intégrée au build (aucune mise à jour appliquée)'
    : `Mise à jour ${Updates.updateId?.slice(0, 8) ?? '—'}${
        Updates.createdAt ? ` du ${Updates.createdAt.toLocaleDateString('fr-FR')}` : ''
      }`;

  const check = async () => {
    if (Platform.OS === 'web' || !Updates.isEnabled) return;
    setState('checking');
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setState('none');
        return;
      }
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync(); // redémarre l'app sur la nouvelle version
    } catch {
      setState('error');
    }
  };

  return (
    <>
      <List.Item
        title="Mise à jour"
        description={description}
        left={(p) => <List.Icon {...p} icon="cloud-download-outline" />}
        right={(p) => (
          <Text {...p} style={{ alignSelf: 'center', color: '#476484', fontWeight: '700' }}>
            {state === 'checking' ? '…' : 'Vérifier'}
          </Text>
        )}
        onPress={check}
        disabled={state === 'checking' || Platform.OS === 'web' || !Updates.isEnabled}
      />
      {state === 'none' ? <Text style={{ textAlign: 'center', fontSize: 12, color: '#4A5562' }}>Déjà à jour.</Text> : null}
      {state === 'error' ? (
        <Text style={{ textAlign: 'center', fontSize: 12, color: '#C0392B' }}>Vérification impossible (réseau ?).</Text>
      ) : null}
    </>
  );
}
