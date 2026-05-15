'use client'

import { useAppStore, type ResourceItem } from '@/lib/store'
import { Search, BookOpen, FileText, Newspaper, Loader2, Clock, TrendingUp, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { getResourceCover } from '@/lib/covers'

const categories = [
  { id: 'all' as const, label: 'All', icon: Search },
  { id: 'book' as const, label: 'Books', icon: BookOpen },
  { id: 'research' as const, label: 'Research', icon: FileText },
  { id: 'magazine' as const, label: 'Magazines', icon: Newspaper },
]

const categoryColors: Record<string, string> = {
  book: 'bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300',
  research: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  magazine: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
}

const popularSearches = ['Algorithms', 'Deep Learning', 'Database', 'Nursing', 'Psychology', 'Clean Code']

export default function SearchScreen() {
  const { searchQuery, setSearchQuery, searchCategory, setSearchCategory, setCurrentScreen, setSelectedBookId, user } = useAppStore()
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [recentlyViewed, setRecentlyViewed] = useState<ResourceItem[]>([])
  const [searchFocused, setSearchFocused] = useState(false)
  const [animatedCount, setAnimatedCount] = useState(0)
  const [prevCount, setPrevCount] = useState(0)
  const [countHighlight, setCountHighlight] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchResources = useCallback(async (query: string, category: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('search', query)
      if (category !== 'all') params.set('category', category)
      params.set('limit', '50')
      const res = await fetch(`/api/resources?${params.toString()}`)
      const data = await res.json()
      if (res.ok && data.resources) {
        const items: ResourceItem[] = data.resources.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          title: r.title as string,
          author: r.author as string,
          category: r.category as 'book' | 'research' | 'magazine',
          coverImage: r.coverImage as string | null,
          availableCopies: r.availableCopies as number,
          totalCopies: r.copies as number,
          shelfLocation: r.shelfLocation as string,
          status: r.status as string,
          subject: r.subject as string,
          tags: (r.tags as string || '').split(',').filter(Boolean),
        }))
        setResources(items)
      }
    } catch (e) {
      console.error('Failed to fetch resources:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch recently viewed (use general resources as a stand-in)
  const fetchRecentlyViewed = useCallback(async () => {
    try {
      const res = await fetch('/api/resources?limit=4')
      const data = await res.json()
      if (res.ok && data.resources) {
        setRecentlyViewed(data.resources.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          title: r.title as string,
          author: r.author as string,
          category: r.category as 'book' | 'research' | 'magazine',
          coverImage: r.coverImage as string | null,
          availableCopies: r.availableCopies as number,
          totalCopies: r.copies as number,
          shelfLocation: r.shelfLocation as string,
          status: r.status as string,
          subject: r.subject as string,
          tags: (r.tags as string || '').split(',').filter(Boolean),
        })))
      }
    } catch {
      // silently fail
    }
  }, [])

  // Filter resources with useMemo (declared before useEffect that references it)
  const filtered = useMemo(() => {
    if (!localQuery.trim() && searchCategory === 'all') return resources
    return resources
  }, [resources, localQuery, searchCategory])

  // Initial load
  useEffect(() => {
    fetchResources(searchQuery, searchCategory)
    fetchRecentlyViewed()
  }, [searchCategory, fetchResources, fetchRecentlyViewed])

  // Animate result count and highlight on change
  useEffect(() => {
    const target = filtered.length
    if (animatedCount === target) return
    const step = animatedCount < target ? 1 : -1
    const timer = setTimeout(() => setAnimatedCount(prev => prev + step), 20)
    return () => clearTimeout(timer)
  }, [filtered.length, animatedCount])

  // Highlight effect when count changes
  useEffect(() => {
    if (filtered.length !== prevCount && prevCount !== 0) {
      setCountHighlight(true)
      const timer = setTimeout(() => setCountHighlight(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevCount(filtered.length)
  }, [filtered.length, prevCount])

  // Debounced search
  const handleSearchChange = (value: string) => {
    setLocalQuery(value)
    setSearchQuery(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => {
      fetchResources(value, searchCategory)
    }, 300)
    setDebounceTimer(timer)
  }

  const handleQuickSearch = (term: string) => {
    setLocalQuery(term)
    setSearchQuery(term)
    fetchResources(term, searchCategory)
    inputRef.current?.blur()
  }

  const clearSearch = () => {
    setLocalQuery('')
    setSearchQuery('')
    fetchResources('', searchCategory)
  }

  const isSearchEmpty = !localQuery.trim() && searchCategory === 'all'

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Search header */}
      <div className="bg-card px-4 pt-4 pb-3 space-y-3 border-b border-gray-100 dark:border-white/5">
        <h2 className="font-bold text-foreground text-lg">Search Catalog</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search books, research, magazines..."
            value={localQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="h-11 pl-9 pr-9 rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#1a0e2e] dark:text-gray-100 focus:border-lib-purple focus:ring-lib-purple/20"
          />
          {localQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>

        {/* Quick search suggestions */}
        <AnimatePresence>
          {(searchFocused || isSearchEmpty) && !localQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-lib-purple dark:text-lib-purple-300" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Popular</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleQuickSearch(term)}
                    className="px-3 py-1.5 rounded-full bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-gray-300 text-xs font-medium hover:bg-lib-purple-100 dark:hover:bg-white/5 active:bg-lib-purple-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filters with spring animation */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = searchCategory === cat.id
            return (
              <motion.button
                key={cat.id}
                onClick={() => setSearchCategory(cat.id)}
                whileTap={{ scale: 0.92 }}
                layout
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-lib-purple text-white dark:shadow-sm dark:shadow-lib-purple/20'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-lib-purple-50 dark:hover:bg-white/5'
                }`}
              >
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="flex items-center gap-1.5"
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                </motion.span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {/* Skeleton loading cards */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-[22px] dark:shadow-sm p-4 flex items-start gap-3"
              >
                <Skeleton className="w-14 h-[72px] rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filtered.length === 0 && localQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center mb-3">
              <Search className="w-8 h-8 text-lib-purple dark:text-lib-purple-300" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No results found</h3>
            <p className="text-sm text-muted-foreground text-center">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Animated total results count with highlight */}
            {!isSearchEmpty && (
              <div className="flex items-center gap-2">
                <motion.span
                  key={animatedCount}
                  initial={{ opacity: 0, y: -4, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`text-xs font-semibold transition-colors duration-300 ${
                    countHighlight ? 'text-lib-purple dark:text-lib-purple-300' : 'text-lib-purple dark:text-lib-purple-300'
                  }`}
                  style={countHighlight ? {
                    textShadow: '0 0 8px rgba(101, 45, 144, 0.4)',
                  } : undefined}
                >
                  {animatedCount}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground"
                >
                  result{animatedCount !== 1 ? 's' : ''} found
                </motion.span>
              </div>
            )}

            {/* Recently Viewed section when search is empty */}
            {isSearchEmpty && recentlyViewed.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-lib-purple dark:text-lib-purple-300" />
                  <h3 className="text-sm font-semibold text-foreground">Recently Viewed</h3>
                </div>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-2 px-2">
                  {recentlyViewed.map((resource) => (
                    <motion.button
                      key={resource.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setSelectedBookId(resource.id); setCurrentScreen('book-detail') }}
                      className="flex-shrink-0 w-[120px] group"
                    >
                      <div className="w-[120px] h-[160px] rounded-2xl mb-2 relative overflow-hidden dark:shadow-sm group-hover:dark:shadow-md transition-shadow">
                        {(() => {
                          const coverSrc = getResourceCover(resource.coverImage, resource.title)
                          return coverSrc ? (
                            <>
                              <img src={coverSrc} alt={resource.title} className="w-full h-full object-cover" />
                              {resource.category && (
                                <span className="absolute top-1.5 left-1.5 bg-white/90 dark:bg-black/60 text-lib-purple dark:text-lib-purple-300 text-[8px] font-bold px-1.5 py-0.5 rounded-lg leading-none">
                                  {resource.category}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="w-full h-full bg-purple-gradient flex items-center justify-center cover-pattern-overlay">
                                <BookOpen className="w-7 h-7 text-white/50" />
                              </div>
                              {resource.category && (
                                <span className="absolute top-1.5 left-1.5 bg-white/90 dark:bg-black/60 text-lib-purple dark:text-lib-purple-300 text-[8px] font-bold px-1.5 py-0.5 rounded-lg leading-none">
                                  {resource.category}
                                </span>
                              )}
                            </>
                          )
                        })()}
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-xs font-semibold text-foreground leading-tight line-clamp-2 min-h-[28px]">{resource.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{resource.author}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Result cards */}
            {filtered.map((resource, index) => (
              <motion.button
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => { setSelectedBookId(resource.id); setCurrentScreen('book-detail') }}
                className="w-full bg-card rounded-[22px] dark:shadow-sm p-4 flex items-start gap-3 text-left card-hover-effect"
              >
                {(() => {
                  const coverSrc = getResourceCover(resource.coverImage, resource.title)
                  return coverSrc ? (
                    <img src={coverSrc} alt={resource.title} className="w-14 h-[72px] rounded-lg object-cover flex-shrink-0 dark:shadow-sm" />
                  ) : (
                    <div className="w-14 h-[72px] rounded-lg bg-purple-gradient flex items-center justify-center flex-shrink-0 cover-pattern-overlay dark:shadow-sm">
                      <BookOpen className="w-5 h-5 text-white/50" />
                    </div>
                  )
                })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{resource.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{resource.author}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryColors[resource.category] || 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                      {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                    </span>
                    {/* Subject/tag pills */}
                    {resource.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300 text-[10px] font-medium">
                        {tag}
                      </span>
                    ))}
                    {resource.subject && resource.tags.length === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300 text-[10px] font-medium">
                        {resource.subject}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-[10px] font-medium ${
                      resource.availableCopies > 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${resource.availableCopies > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                      {resource.availableCopies > 0 ? `${resource.availableCopies}/${resource.totalCopies}` : 'Out'}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
        <div className="h-24" />
      </div>
    </div>
  )
}
