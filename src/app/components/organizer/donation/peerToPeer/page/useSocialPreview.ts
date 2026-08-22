import { useEffect } from 'react';

interface SocialPreview {
  title: string;
  description: string;
  url: string;
}

const MANAGED_ATTRIBUTE = 'data-fundraiser-preview';

const upsertMetaTag = (attribute: 'property' | 'name', key: string, content: string) => {
  const selector = `meta[${attribute}="${key}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    tag.setAttribute(MANAGED_ATTRIBUTE, 'true');
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
};

/**
 * Makes a shared link look like the person rather than like a generic page. Distribution is the whole
 * point of a peer-to-peer page: a link that previews as nothing is a link nobody clicks.
 *
 * Written straight onto the document because this project carries no head-management library, and one
 * screen does not justify adding a dependency. Only tags this hook created are removed on unmount, so
 * it can never strip a tag the application shipped in its own index.html.
 */
export function useSocialPreview({ title, description, url }: SocialPreview): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    upsertMetaTag('property', 'og:title', title);
    upsertMetaTag('property', 'og:description', description);
    upsertMetaTag('property', 'og:url', url);
    upsertMetaTag('property', 'og:type', 'website');
    upsertMetaTag('name', 'description', description);
    upsertMetaTag('name', 'twitter:card', 'summary');
    upsertMetaTag('name', 'twitter:title', title);
    upsertMetaTag('name', 'twitter:description', description);

    return () => {
      document.title = previousTitle;
      document.head
        .querySelectorAll(`meta[${MANAGED_ATTRIBUTE}]`)
        .forEach((tag) => tag.remove());
    };
  }, [title, description, url]);
}
