import { whatsappUrl } from "@/lib/nav";

export function WhatsappButton() {
  return (
    <a
      href={whatsappUrl()}
      rel="noopener"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-pill bg-verde px-4 py-3 text-[13px] font-semibold text-[#0f2e1a] shadow-floating transition-transform hover:scale-[1.03]"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 6.9 12.1l-.3.5.7 2.5-2.6-.7-.5.3A8 8 0 1 1 12 4zm-3 4.3c-.2 0-.5 0-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3 2 3.1 4.9 4.3c2.4 1 2.9.8 3.4.8.5 0 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4l-.6-.3-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.5.1a6.6 6.6 0 0 1-2-1.2 7.3 7.3 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.5.3-.5v-.5l-.8-1.9c-.2-.4-.4-.4-.6-.4h-.7z" />
      </svg>
      WhatsApp
    </a>
  );
}
