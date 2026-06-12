"use client";

import { useEffect, useState } from "react";

/**
 * Local-only product form flags (not yet persisted to DB).
 * Auto-enables hasMultipleOptions when option groups become non-empty.
 */
export function useProductFormFlags(optionGroupsLength: number) {
  const [manageQuantity, setManageQuantity] = useState(true);
  const [hasMultipleOptions, setHasMultipleOptions] = useState(false);
  const [isDeliverable, setIsDeliverable] = useState(true);
  const [isTicket, setIsTicket] = useState(false);
  const [hidePrice, setHidePrice] = useState(false);
  const [acceptFileOrImage, setAcceptFileOrImage] = useState(false);

  useEffect(() => {
    if (optionGroupsLength > 0 && !hasMultipleOptions) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-enable the toggle when groups appear, preserving user override afterwards
      setHasMultipleOptions(true);
    }
  }, [optionGroupsLength, hasMultipleOptions]);

  return {
    manageQuantity,
    setManageQuantity,
    hasMultipleOptions,
    setHasMultipleOptions,
    isDeliverable,
    setIsDeliverable,
    isTicket,
    setIsTicket,
    hidePrice,
    setHidePrice,
    acceptFileOrImage,
    setAcceptFileOrImage,
  };
}
