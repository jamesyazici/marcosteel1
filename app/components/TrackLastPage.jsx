"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function TrackLastPage() {
  const pathname = usePathname();

  useEffect(() => {
    // store full URL (matches your previous approach)
    sessionStorage.setItem("lastPage", window.location.href);
  }, [pathname]);

  return null;
}
