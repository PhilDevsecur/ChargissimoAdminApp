/**
 * Les désignations de lignes et les notes client sont du HTML d'éditeur riche (TinyMCE,
 * hérité de WinDev) — parfois même du RTF, ou la valeur vide `<meta charset="utf-8" />0`
 * On les aplatit en texte : JAMAIS injectées.
 */
const ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", euro: '€', eacute: 'é', egrave: 'è',
  ecirc: 'ê', agrave: 'à', acirc: 'â', ccedil: 'ç', ocirc: 'ô', ucirc: 'û', ugrave: 'ù', icirc: 'î', iuml: 'ï',
  laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', hellip: '…', ndash: '–', mdash: '—', deg: '°',
};

export const htmlToText = (html: string | null | undefined): string => {
  if (!html) return '';
  // Les retours chariot du source HTML ne sont pas des sauts de ligne affichés.
  let s = String(html).replace(/\r?\n/g, ' ');
  if (s.trimStart().startsWith('{\\rtf')) {
    // RTF : on garde le texte brut, sans les groupes de contrôle.
    s = s.replace(/\{\\\*[^{}]*\}/g, '').replace(/\\par[d]?/g, '\n').replace(/\\[a-z]+-?\d* ?/gi, '').replace(/[{}]/g, '');
  }
  s = s
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h\d)\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // Valeur « vide » laissée par l'ancien éditeur.
  return s === '0' ? '' : s;
};
