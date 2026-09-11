/**
 * Plantillas de correo de Casa Turística Valema.
 * Estructura del handoff: cabecera azul carbón con la marca, título en
 * Merriweather, cuerpo 13px/1.75, bloque de datos sobre marfil, CTA pill,
 * pie legal. Ancho 392 px, compatible con clientes de correo.
 */

import { LEGAL_INFO, CONTACT } from "@/lib/nav";

const C = {
  carbon: "#1D2A3A",
  marfil: "#F5F5F0",
  oro: "#D4AF37",
  oroTexto: "#B08D1F",
  ink: "#1D2A3A",
  ink2: "#4a5462",
  ink3: "#767f8c",
  hair: "#e6e4dc",
};

export type EmailBlock =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "datos"; filas: [string, string][] }
  | { tipo: "cta"; texto: string; url: string }
  | { tipo: "aviso"; texto: string }
  | { tipo: "lista"; items: string[] };

export type RenderedEmail = { subject: string; html: string; text: string };

export function renderEmail(params: {
  subject: string;
  preheader?: string;
  titulo: string;
  saludo?: string;
  bloques: EmailBlock[];
}): RenderedEmail {
  const { subject, preheader, titulo, saludo, bloques } = params;

  const body = bloques
    .map((b) => {
      switch (b.tipo) {
        case "parrafo":
          return `<p style="margin:0 0 14px;font-size:13px;line-height:1.75;color:${C.ink2}">${b.texto}</p>`;
        case "aviso":
          return `<div style="margin:0 0 14px;padding:12px 14px;background:#FFF9E8;border-radius:12px;font-size:12.5px;line-height:1.6;color:${C.oroTexto}">${b.texto}</div>`;
        case "lista":
          return `<ul style="margin:0 0 14px;padding-left:18px;font-size:13px;line-height:1.7;color:${C.ink2}">${b.items
            .map((i) => `<li style="margin-bottom:6px">${i}</li>`)
            .join("")}</ul>`;
        case "datos":
          return `<table role="presentation" width="100%" style="margin:0 0 16px;background:${C.marfil};border-radius:16px;border-collapse:separate">
            <tbody>${b.filas
              .map(
                ([k, v], i) =>
                  `<tr><td style="padding:${i === 0 ? "14px" : "8px"} 16px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:${C.ink3};width:42%">${k}</td>
                   <td style="padding:${i === 0 ? "14px" : "8px"} 16px 8px;font-size:12.5px;color:${C.ink};text-align:right">${v}</td></tr>`,
              )
              .join("")}</tbody>
          </table>`;
        case "cta":
          return `<table role="presentation" style="margin:4px 0 18px"><tr><td style="border-radius:999px;background:${C.oro}">
            <a href="${b.url}" style="display:inline-block;padding:11px 22px;font-size:13px;font-weight:600;color:${C.carbon};text-decoration:none;border-radius:999px">${b.texto}</a>
          </td></tr></table>`;
      }
    })
    .join("\n");

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#e6e4dc;font-family:'Montserrat',Segoe UI,Helvetica,Arial,sans-serif">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>` : ""}
<table role="presentation" width="100%" style="background:#e6e4dc"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="392" style="width:392px;max-width:100%;background:#ffffff;border-radius:18px;overflow:hidden">
  <tr><td style="background:${C.carbon};padding:24px 28px;text-align:center">
    <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${C.marfil}">Valema</span>
    <div style="font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:${C.oro};margin-top:4px">Casa turística</div>
  </td></tr>
  <tr><td style="padding:26px 28px 30px">
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:1.3;color:${C.ink}">${titulo}</h1>
    ${saludo ? `<p style="margin:0 0 14px;font-size:13px;line-height:1.75;color:${C.ink2}">${saludo}</p>` : ""}
    ${body}
  </td></tr>
  <tr><td style="padding:16px 28px 22px;border-top:1px solid ${C.hair};font-size:10.5px;line-height:1.6;color:${C.ink3}">
    ${LEGAL_INFO.razonSocial} · ${LEGAL_INFO.rnt} · ${LEGAL_INFO.ciudad}<br>
    ${CONTACT.correo} · ${CONTACT.telefono}<br>
    Recibes este correo por una reserva o consulta hecha en valema.co.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    titulo,
    "",
    saludo ?? "",
    ...bloques.flatMap((b) => {
      if (b.tipo === "parrafo" || b.tipo === "aviso") return [b.texto, ""];
      if (b.tipo === "lista") return [...b.items.map((i) => `- ${i}`), ""];
      if (b.tipo === "datos") return [...b.filas.map(([k, v]) => `${k}: ${v}`), ""];
      if (b.tipo === "cta") return [`${b.texto}: ${b.url}`, ""];
      return [];
    }),
    `${LEGAL_INFO.razonSocial} · ${CONTACT.correo} · ${CONTACT.telefono}`,
  ].join("\n");

  return { subject, html, text };
}
