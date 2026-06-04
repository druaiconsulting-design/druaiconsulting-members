/**
 * Push a new path into history and fire popstate so App re-renders.
 * Never import react-router or wouter — this is the entire routing layer.
 */
export function navigate(path: string): void {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/**
 * Match a pattern like "/courses/:courseId/lessons/:lessonId" against a
 * real pathname. Returns a params object on match, null on mismatch.
 */
export function matchRoute(
  pattern: string,
  path: string
): Record<string, string> | null {
  const pp = pattern.split('/')
  const rp = path.split('/')
  if (pp.length !== rp.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = decodeURIComponent(rp[i])
    } else if (pp[i] !== rp[i]) {
      return null
    }
  }
  return params
}
