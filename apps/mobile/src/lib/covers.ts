// Book cover image mapping
// Maps book title keywords to generated cover image paths
// Covers generated using AI image generation (z-ai-web-dev-sdk)
const coverMap: Record<string, string> = {
  'introduction-to-algorithms': '/covers/introduction-to-algorithms.png',
  'clean-code': '/covers/clean-code.png',
  'design-patterns': '/covers/design-patterns.png',
  'artificial-intelligence': '/covers/ai-modern-approach.png',
  'ai-modern-approach': '/covers/ai-modern-approach.png',
  'deep-learning': '/covers/deep-learning.png',
  'the-pragmatic-programmer': '/covers/the-pragmatic-programmer.png',
  'pragmatic-programmer': '/covers/the-pragmatic-programmer.png',
  'database-systems': '/covers/database-systems.png',
  'psychology': '/covers/psychology-101.png',
  'nursing': '/covers/nursing-fundamentals.png',
  'scientific-american': '/covers/scientific-american.png',
}

/**
 * Get a book cover image path based on the title.
 * Returns null if no matching cover is found.
 */
export function getBookCover(title: string): string | null {
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-')
  for (const [key, path] of Object.entries(coverMap)) {
    if (normalizedTitle.includes(key) || key.includes(normalizedTitle.slice(0, 10))) {
      return path
    }
  }
  return null
}

/**
 * Get the best available cover image for a resource.
 * Priority: coverImage from API > generated cover from title > null
 */
export function getResourceCover(coverImage: string | null, title: string): string | null {
  if (coverImage) return coverImage
  return getBookCover(title)
}
