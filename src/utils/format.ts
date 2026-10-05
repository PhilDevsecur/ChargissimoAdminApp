const p2 = (n: number) => String(n).padStart(2, '0');

/**
 * Date/heure renvoyées par le serveur (ISO UTC) → affichage local.
 * ⚠️ Pas de `toLocaleString` : l'ICU de Hermes (Android) est incomplète selon les builds,
 * on formate à la main — même choix que l'admin web (`fmtDate` du framework).
 */
export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${formatDate(iso)} ${p2(d.getHours())}h${p2(d.getMinutes())}`;
};

/** « Aujourd'hui 14h05 », « Hier 09h12 », sinon « 03/10/2026 ». */
export const formatRelative = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const time = `${p2(d.getHours())}h${p2(d.getMinutes())}`;
  if (sameDay(d, today)) return `Aujourd'hui ${time}`;
  if (sameDay(d, yesterday)) return `Hier ${time}`;
  return formatDate(iso);
};

/** 1234.5 → « 1 234,50 € » (espace simple : pas d'espace fine insécable U+202F). */
export const formatMoney = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(Number(n))) return '—';
  const [int, dec] = Math.abs(Number(n)).toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${Number(n) < 0 ? '-' : ''}${grouped},${dec} €`;
};

/** Indicatif + numéro national (« +33 », « 609487128 ») → affichage et lien tel:. */
export const formatPhone = (dialing: string | null | undefined, num: string | null | undefined) => {
  const n = String(num || '').replace(/\s+/g, '').replace(/^0/, '');
  if (!n) return null;
  const code = String(dialing || '').replace(/\D/g, '');
  const e164 = code ? `+${code}${n}` : n;
  return { display: prettyPhone(e164), e164 };
};

/** « +33609487128 » → « +33 6 09 48 72 81 » (France), sinon inchangé. */
export const prettyPhone = (e164: string): string => {
  const m = /^\+33(\d)(\d{8})$/.exec(e164);
  if (!m) return e164;
  return `+33 ${m[1]} ${m[2].replace(/(\d{2})(?=\d)/g, '$1 ')}`;
};
