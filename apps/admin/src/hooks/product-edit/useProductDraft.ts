// Auto-save & restore product-edit form state via localStorage.
//
// Wraps the storage primitives in _draft.ts with React's lifecycle:
//   - Load draft once on mount (only for new products)
//   - Auto-save on every form change (skipped while empty)
//
// Returns `draftLoaded` so consumers know whether the load pass has finished
// (prevents auto-save from clobbering an unfinished load).

import { useEffect, useState } from "react";

import { loadDraft, saveDraft, type DraftData } from "./_draft";

interface UseProductDraftArgs {
  enabled: boolean;
  current: Omit<DraftData, "savedAt">;
  onRestore: (draft: DraftData) => void;
}

export function useProductDraft({ enabled, current, onRestore }: UseProductDraftArgs) {
  const [draftLoaded, setDraftLoaded] = useState(false);

  // 1) Load on mount (only when new + not yet loaded).
  useEffect(() => {
    if (!enabled || draftLoaded) return;
    const draft = loadDraft();
    if (draft) onRestore(draft);
    // Intentional one-shot draft restore on first mount when enabled.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftLoaded(true);
    // onRestore is intentionally not in the dep array — it's a one-shot load
    // and re-running on every parent re-render would double-restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, draftLoaded]);

  // 2) Auto-save while editing. Skip empty drafts so we don't overwrite a
  //    previous session's draft as soon as the form mounts.
  useEffect(() => {
    if (!enabled || !draftLoaded) return;

    const isEmpty =
      !current.name &&
      !current.description &&
      current.images.length === 0 &&
      current.productDetails.length === 0;
    if (isEmpty) return;

    saveDraft(current);
  }, [enabled, draftLoaded, current]);

  return { draftLoaded };
}
