import { useEffect } from "react";
import { getLang } from "@/lib/i18n";

function upsertMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (content === undefined || content === null || content === "") {
    if (element) element.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", String(content));
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export function useSEO({
  title,
  description,
  image,
  type = "website",
  canonical,
  robots = "index,follow,max-image-preview:large",
  keywords,
  schema,
} = {}) {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const currentUrl = canonical || `${window.location.origin}${window.location.pathname}`;
    const lang = getLang() === "en" ? "en_US" : "ar_AR";
    if (title) document.title = title;
    upsertMeta("name", "description", description || title || "2Morro Technology Solutions");
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "googlebot", robots);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", currentUrl);
    upsertMeta("property", "og:site_name", "2Morro Technology Solutions");
    upsertMeta("property", "og:locale", lang);
    upsertMeta("property", "og:image", image);
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);
    upsertLink("canonical", currentUrl);

    let schemaElement = document.getElementById("page-structured-data");
    if (schema) {
      if (!schemaElement) {
        schemaElement = document.createElement("script");
        schemaElement.id = "page-structured-data";
        schemaElement.type = "application/ld+json";
        document.head.appendChild(schemaElement);
      }
      schemaElement.textContent = JSON.stringify(schema);
    } else if (schemaElement) {
      schemaElement.remove();
    }
    return () => {
      const currentSchema = document.getElementById("page-structured-data");
      if (currentSchema && !schema) currentSchema.remove();
    };
  }, [title, description, image, type, canonical, robots, keywords, schema]);
}
