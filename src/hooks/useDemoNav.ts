import { useEffect, useState } from "react";

const KEY = "demoNavEnabled";
const EVENT = "demoNavToggled";

export const isDemoNavEnabled = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "true";
};

export const setDemoNavEnabled = (enabled: boolean) => {
  localStorage.setItem(KEY, String(enabled));
  window.dispatchEvent(new Event(EVENT));
};

export const useDemoNav = () => {
  const [enabled, setEnabled] = useState(isDemoNavEnabled);

  useEffect(() => {
    const handler = () => setEnabled(isDemoNavEnabled());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return enabled;
};
