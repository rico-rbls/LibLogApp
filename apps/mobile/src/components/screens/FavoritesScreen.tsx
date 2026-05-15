'use client'

import { useAppStore, type ResourceItem } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, BookOpen, ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { getResourceCover } from '@/lib/covers'

export default function FavoritesScreen() {
  const { user, favorites, toggleFavorite, setCurrentScreen, setSelectedBookId, goBack } = useAppStore()
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFavorites = useCallback(async () => {
    if (favorites.length === 0) {
      setResources([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const favResources: ResourceItem[] = []
      // Fetch each favorite resource
      for (const id of favorites) {
        try {
          const res = await fetch(`/api/resources/${id}`)
          if (res.ok) {
            const data = await res.json()
            favResources.push({
              id: data.id,
              title: data.title,
              author: data.author,
              category: data.category,
              coverImage: data.coverImage,
              availableCopies: data.availableCopies,
              totalCopies: data.copies,
              shelfLocation: data.shelfLocation,
              status: data.status,
              subject: data.subject,
              tags: (data.tags || '').split(',').filter(Boolean),
            })
          }
        } catch {
          // Skip failed fetches
        }
      }
      setResources(favResources)
    } catch (e) {
      console.error('Failed to fetch favorites:', e)
    } finally {
      setLoading(false)
    }
  }, [favorites])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const handleRemove = (id: string, title: string) => {
    toggleFavorite(id)
    setResources(prev => prev.filter(r => r.id !== id))
  }

  const categoryColors: Record<string, string> = {
    book: 'bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300',
    research: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    magazine: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full hover:bg-lib-purple-50 dark:hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-foreground text-lg">My Favorites</h2>
          <p className="text-xs text-muted-foreground">{resources.length} saved resource{resources.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="w-9 h-9 rounded-[14px] bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
        </div>
      </div>

      {/* Favorites list */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-lib-purple animate-spin" />
          </div>
        ) : resources.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-20 h-20 rounded-[22px] bg-lib-purple-50 dark:bg-white/10 flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-lib-purple dark:text-lib-purple-300" />
            </div>
            <h3 className="font-bold text-foreground mb-1">No favorites yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-[240px]">
              Tap the heart icon on any book to save it here for quick access
            </p>
            <Button
              onClick={() => setCurrentScreen('search')}
              className="bg-lib-purple hover:bg-lib-purple-dark text-white text-xs h-9 px-4 rounded-xl"
            >
              Browse Catalog
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {resources.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden"
                >
                  <div className="p-4 flex items-start gap-3">
                    <button
                      onClick={() => { setSelectedBookId(resource.id); setCurrentScreen('book-detail') }}
                      className="flex-shrink-0"
                    >
                      {(() => {
                        const coverSrc = getResourceCover(resource.coverImage, resource.title)
                        return coverSrc ? (
                          <img src={coverSrc} alt={resource.title} className="w-14 h-[72px] rounded-lg object-cover dark:shadow-sm" />
                        ) : (
                          <div className="w-14 h-[72px] rounded-lg bg-purple-gradient flex items-center justify-center cover-pattern-overlay dark:shadow-sm">
                            <BookOpen className="w-5 h-5 text-white/50" />
                          </div>
                        )
                      })()}
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => { setSelectedBookId(resource.id); setCurrentScreen('book-detail') }}
                        className="text-left w-full"
                      >
                        <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{resource.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{resource.author}</p>
                      </button>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryColors[resource.category] || 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                          {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-medium ${
                          resource.availableCopies > 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${resource.availableCopies > 0 ? 'bg-green-500' : 'bg-red-400'}`} />
                          {resource.availableCopies > 0 ? `${resource.availableCopies} available` : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(resource.id, resource.title)}
                      className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors flex-shrink-0 group"
                      aria-label="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
        <div className="h-24" />
      </div>
    </div>
  )
}
