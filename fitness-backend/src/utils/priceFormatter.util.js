export const eurToCents = (eur) => Math.round(eur * 100);
export const centsToEur = (cents) => +(cents / 100).toFixed(2);
export const formatPrice = (eur, currency = 'EUR') =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(eur);
