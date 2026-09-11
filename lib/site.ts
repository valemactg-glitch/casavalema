/**
 * URL pública del sitio.
 * - `NEXT_PUBLIC_SITE_URL` manda si está configurada (con `||`, no `??`:
 *   una variable presente pero vacía "" también debe caer al siguiente
 *   valor, en vez de romper `new URL()` en el build).
 * - Si no está, Vercel expone `VERCEL_URL` (el host de cada deploy, sin
 *   protocolo) en cada build y en runtime.
 * - Si tampoco existe (build local sin `.env`), cae al dominio final.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "https://valema.co";
