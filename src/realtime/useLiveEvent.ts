import { useEffect, useRef } from 'react';
import Pusher from './pusherClient';
import { authApi } from '@/api';

/**
 * Temps réel via les canaux Pusher PUBLICS du site — utilisés par l'admin web
 * (`orders`, `invoices`, `customers` ; événements create / update /
 * delete ; charges = identifiants seulement, aucune donnée client). Jamais de polling :
 * sur le Grand Comptoir, des téléphones qui interrogeaient toutes les 4 s ont saturé
 * MariaDB (2026-09-16).
 *
 * Une seule connexion Pusher pour toute l'app, créée à la première utilisation avec
 * la clé publique servie par /api/mobile-admin/config.
 */
type PusherInstance = InstanceType<typeof Pusher>;
let pusherPromise: Promise<PusherInstance | null> | null = null;

const getPusher = (): Promise<PusherInstance | null> => {
  pusherPromise =
    pusherPromise ??
    authApi
      .config()
      .then((cfg) => (cfg.pusher ? new Pusher(cfg.pusher.key, { cluster: cfg.pusher.cluster }) : null))
      .catch(() => {
        pusherPromise = null; // on retentera au prochain écran
        return null;
      });
  return pusherPromise;
};

/** Appelle `onEvent` à chaque `event` émis sur `channel` tant que le composant est monté. */
export function useLiveEvent(channel: string, event: string, onEvent: () => void) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!channel) return; // aucun canal demandé (liste sans temps réel)
    let cancelled = false;
    let unbind: (() => void) | null = null;
    getPusher().then((pusher) => {
      if (!pusher || cancelled) return;
      const ch = pusher.subscribe(channel);
      const cb = () => handler.current();
      ch.bind(event, cb);
      unbind = () => ch.unbind(event, cb);
    });
    return () => {
      cancelled = true;
      unbind?.();
    };
  }, [channel, event]);
}
