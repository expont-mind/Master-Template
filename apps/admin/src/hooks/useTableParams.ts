"use client";

import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { useCallback, useMemo } from "react";

type ParamValue = string | number;
type Defaults = Record<string, ParamValue>;

function buildParsers<T extends Defaults>(defaults: T) {
  const parsers: Record<
    string,
    ReturnType<typeof parseAsString.withDefault> | ReturnType<typeof parseAsInteger.withDefault>
  > = {};
  for (const key in defaults) {
    const val = defaults[key];
    if (typeof val === "number") {
      parsers[key] = parseAsInteger.withDefault(val);
    } else {
      parsers[key] = parseAsString.withDefault(val);
    }
  }
  return parsers;
}

export function useTableParams<T extends Defaults>(defaults: T) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parsers = useMemo(() => buildParsers(defaults), []);

  const [state, setState] = useQueryStates(parsers, {
    history: "replace",
    clearOnDefault: true,
  });

  const params = state as unknown as T;

  const setParam = useCallback(
    <K extends keyof T & string>(key: K, value: T[K]) => {
      setState({ [key]: value } as Partial<typeof state>);
    },
    [setState],
  );

  const setParams = useCallback(
    (updates: Partial<T>) => {
      setState(updates as Partial<typeof state>);
    },
    [setState],
  );

  return { params, setParam, setParams };
}
