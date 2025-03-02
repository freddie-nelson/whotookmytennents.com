import { useState } from "react";

export function useIsMobile() {
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const [isMobile] = useState(mobileRegex.test(navigator.userAgent));

  return isMobile;
}
