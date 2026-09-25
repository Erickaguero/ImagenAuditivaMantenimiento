import { useEffect } from "react";

function setMetaDescription(content: string) {
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = "description";
    document.head.appendChild(tag);
  }
  tag.content = content;
}

/** Cambia el <title> y la meta description de la página actual. */
export function usePageMeta(title: string | undefined, description?: string) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMetaDescription(description);
  }, [title, description]);
}
