// Selected families store ("shopping bag"), persisted like fonts.google.com.
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "gf-selected-families";

type Listener = () => void;
const listeners = new Set<Listener>();

let families: string[] = readStorage();

function readStorage(): string[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((f) => typeof f === "string")
      : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(families));
  } catch {
    // Storage may be unavailable (private mode, embeds); selection stays in memory.
  }
  for (const listener of listeners) listener();
}

export function selectedFamilies(): string[] {
  return families;
}

export function isSelected(family: string) {
  return families.includes(family);
}

export function addFamily(family: string) {
  if (families.includes(family)) return;
  families = [...families, family];
  persist();
}

export function removeFamily(family: string) {
  if (!families.includes(family)) return;
  families = families.filter((item) => item !== family);
  persist();
}

export function clearFamilies() {
  if (!families.length) return;
  families = [];
  persist();
}

export function useSelectedFamilies(): string[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => families,
    () => families,
  );
}
