"use client";

export default function BackButton({ fallbackHref = "/" , className, children }) {
  function onClick(e) {
    // 1) Try sessionStorage (your old approach)
    const last = sessionStorage.getItem("lastPage");
    const current = window.location.href;

    if (last && last !== current) {
      try {
        const lastUrl = new URL(last);
        const currentUrl = new URL(current);
        const sameOrigin = lastUrl.origin === currentUrl.origin;

        if (sameOrigin) {
          e.preventDefault();
          window.location.href = last;
          return;
        }
      } catch (_) {
        // ignore bad URL
      }
    }

    // 2) Try browser history
    if (window.history.length > 1) {
      e.preventDefault();
      window.history.back();
      return;
    }

    // 3) Fallback: normal link navigation
    // (do nothing; browser will follow href)
  }

  return (
    <a href={fallbackHref} onClick={onClick} className={className} style={{ textDecoration: "none" }}>
      {children}
    </a>
  );
}
