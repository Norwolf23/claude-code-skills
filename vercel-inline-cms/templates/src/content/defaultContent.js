// Default site content. The CMS hydrates over this on first load; if storage is empty or
// unreachable, the site falls back to these strings.
//
// To add a new editable field:
//   1. Add it here as a key (supports nested objects and arrays).
//   2. Reference it from a page via <EditableText path="some.dot.path" />.
//
// Path lookup supports dot/bracket notation, e.g. "home.items[0].title".
export const DEFAULT_CONTENT = {
  hero: {
    headline: 'Your headline here',
    subhead: 'Add a short subheadline.',
  },
};
