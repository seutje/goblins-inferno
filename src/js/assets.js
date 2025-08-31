export function versioned(path) {
  try {
    if (typeof window !== 'undefined') {
      const v = window.APP_VERSION || new URLSearchParams(window.location.search).get('v') || 'dev';
      const hasQuery = path.includes('?');
      return path + (hasQuery ? '&' : '?') + 'v=' + encodeURIComponent(v);
    }
  } catch {}
  return path;
}

