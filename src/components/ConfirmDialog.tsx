import { useEffect, useState } from 'react';
import { Button, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import { useKeyboardHeight } from '@/components/FormScroll';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  /** Affiche un champ texte (ex. motif du refus). */
  withNote?: string;
  /** Le champ texte doit être rempli pour pouvoir confirmer. */
  noteRequired?: boolean;
  onConfirm: (note: string) => Promise<void> | void;
}

/** Dialogue de confirmation (Alert.alert ne fonctionne pas sur le web de dev). */
export function ConfirmDialog({ request, onDismiss }: { request: ConfirmRequest | null; onDismiss: () => void }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  // Le dialogue est centré par le Portal : sans ça, le clavier recouvre ses boutons
  // (« Retour » / la confirmation) dès qu'il y a un champ motif.
  const keyboard = useKeyboardHeight();

  useEffect(() => {
    setNote('');
    setBusy(false);
  }, [request]);

  const confirm = async () => {
    if (!request) return;
    setBusy(true);
    try {
      await request.onConfirm(note.trim());
    } finally {
      setBusy(false);
      onDismiss();
    }
  };

  return (
    <Portal>
      <Dialog visible={!!request} onDismiss={busy ? undefined : onDismiss} style={keyboard ? { marginBottom: keyboard } : undefined}>
        <Dialog.Title>{request?.title}</Dialog.Title>
        <Dialog.Content>
          <Text>{request?.message}</Text>
          {request?.withNote ? (
            <TextInput
              mode="outlined"
              label={request.withNote}
              value={note}
              onChangeText={setNote}
              multiline
              style={{ marginTop: 12 }}
            />
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button mode="text" onPress={onDismiss} disabled={busy}>
            Retour
          </Button>
          <Button
            mode="contained"
            onPress={confirm}
            loading={busy}
            disabled={busy || (!!request?.noteRequired && !note.trim())}
            buttonColor={request?.destructive ? '#C0392B' : undefined}
          >
            {request?.confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
