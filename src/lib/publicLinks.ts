export function publicAppPath(slug: string) {
  return `/app/${slug}`;
}

export function publicAppUrl(origin: string, slug: string) {
  return `${origin}${publicAppPath(slug)}`;
}
