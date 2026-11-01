import { useEffect } from "react";

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSEO({ title, description }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");
    if (description) setMeta("name", "description", description);
    if (title) setMeta("property", "og:title", title);
    if (description) setMeta("property", "og:description", description);
    return () => {
      document.title = prevTitle;
      if (prevDesc) setMeta("name", "description", prevDesc);
    };
  }, [title, description]);
}
