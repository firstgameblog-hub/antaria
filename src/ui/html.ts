/** Экранирование текста перед вставкой в разметку. */

const REPLACEMENTS: ReadonlyArray<[string, string]> = [
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['"', '&quot;'],
]

export function escapeHtml(text: string): string {
  let result = text
  for (const [from, to] of REPLACEMENTS) {
    result = result.replaceAll(from, to)
  }
  return result
}
