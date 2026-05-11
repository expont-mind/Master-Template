import { useEffect, useRef } from "react";

/** Reset page to 1 when filter deps change, but skip the initial mount. */
export function useResetPage(
  reset: () => void,
  deps: React.DependencyList
) {
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
