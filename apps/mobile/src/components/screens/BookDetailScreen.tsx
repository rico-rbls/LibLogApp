'use client'

import { useAppStore, type ResourceItem } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BookOpen, MapPin, Bookmark, ChevronRight, Loader2, Heart, Share2, Calendar, Hash, Star, MessageSquare, Trash2, Pencil, X, Library } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getResourceCover } from '@/lib/covers'

interface ReviewUser {
  id: string
  fullName: string
  avatarInitials: string | null
  role: string
}

interface ReviewItem {
  id: string
  userId: string
  resourceId: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
  user: ReviewUser
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  distribution: number[]
}

export default function BookDetailScreen() {
  const { selectedBookId, user, goBack, setCurrentScreen, setSelectedBookId, toggleFavorite, isFavorite } = useAppStore()
  const [book, setBook] = useState<(ResourceItem & { description: string; isbn?: string; publicationDate?: string }) | null>(null)
  const [relatedBooks, setRelatedBooks] = useState<ResourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [borrowing, setBorrowing] = useState(false)
  const [startingReading, setStartingReading] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [hearted, setHearted] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const { toast } = useToast()

  // Review state
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0, distribution: [0, 0, 0, 0, 0] })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)

  const userReview = reviews.find(r => r.userId === user?.id)

  const fetchBook = useCallback(async () => {
    if (!selectedBookId) return
    try {
      const res = await fetch(`/api/resources/${selectedBookId}`)
      const data = await res.json()
      if (res.ok) {
        setBook({
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
          description: data.abstract || 'No description available.',
          isbn: data.isbn || undefined,
          publicationDate: data.publicationDate || undefined,
        })
        setHearted(isFavorite(data.id))
      }
    } catch (e) {
      console.error('Failed to fetch book:', e)
    } finally {
      setLoading(false)
    }
  }, [selectedBookId, isFavorite])

  const fetchRelated = useCallback(async () => {
    if (!selectedBookId) return
    try {
      const res = await fetch(`/api/resources?limit=4`)
      const data = await res.json()
      if (res.ok && data.resources) {
        const items: ResourceItem[] = data.resources
          .filter((r: Record<string, unknown>) => r.id !== selectedBookId)
          .slice(0, 3)
          .map((r: Record<string, unknown>) => ({
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
        setRelatedBooks(items)
      }
    } catch (e) {
      console.error('Failed to fetch related:', e)
    }
  }, [selectedBookId])

  const fetchReviews = useCallback(async () => {
    if (!selectedBookId) return
    try {
      const res = await fetch(`/api/reviews?resourceId=${selectedBookId}`)
      const data = await res.json()
      if (res.ok) {
        setReviews(data.reviews || [])
        setReviewStats(data.stats || { averageRating: 0, totalReviews: 0, distribution: [0, 0, 0, 0, 0] })
      }
    } catch (e) {
      console.error('Failed to fetch reviews:', e)
    }
  }, [selectedBookId])

  useEffect(() => {
    fetchBook()
    fetchRelated()
    fetchReviews()
  }, [fetchBook, fetchRelated, fetchReviews])

  const handleStartReading = async () => {
    if (!user?.id || !book) return
    setStartingReading(true)
    try {
      const res = await fetch('/api/reading-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, resourceId: book.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error?.includes('already have an active')) {
          toast({ title: 'Already Reading', description: 'You already have an active reading session for this book.' })
        } else {
          toast({ title: 'Cannot Start Reading', description: data.error || 'Something went wrong', variant: 'destructive' })
        }
        return
      }
      toast({ title: 'Reading Started!', description: `You're now reading "${book.title}" in the library.` })
      fetchBook()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setStartingReading(false)
    }
  }

  const handleBorrow = async () => {
    if (!user?.id || !book) return
    setBorrowing(true)
    try {
      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, resourceId: book.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Cannot Borrow', description: data.error || 'Something went wrong', variant: 'destructive' })
        return
      }
      toast({ title: 'Book Borrowed!', description: `${book.title} has been checked out to you.` })
      fetchBook()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setBorrowing(false)
    }
  }

  const handleReserve = async () => {
    if (!user?.id || !book) return
    setReserving(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, resourceId: book.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Cannot Reserve', description: data.error || 'Something went wrong', variant: 'destructive' })
        return
      }
      toast({ title: 'Reserved!', description: `You'll be notified when ${book.title} becomes available.` })
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setReserving(false)
    }
  }

  const handleFavorite = () => {
    if (!book) return
    toggleFavorite(book.id)
    setHearted(!hearted)
    toast({
      title: hearted ? 'Removed from Favorites' : 'Added to Favorites',
      description: hearted ? `${book.title} removed from your favorites.` : `${book.title} added to your favorites!`,
    })
  }

  const handleShare = async () => {
    if (!book) return
    const shareText = `Check out "${book.title}" by ${book.author} on LibLog!`
    if (navigator.share) {
      try {
        await navigator.share({ title: book.title, text: shareText })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    }
  }

  const handleSubmitReview = async () => {
    if (!user?.id || !book || reviewRating === 0) return
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          resourceId: book.id,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to submit review', variant: 'destructive' })
        return
      }
      toast({ title: userReview ? 'Review Updated!' : 'Review Submitted!', description: 'Thank you for your feedback.' })
      setShowReviewForm(false)
      setReviewRating(0)
      setReviewComment('')
      fetchReviews()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    setDeletingReviewId(reviewId)
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
      if (!res.ok) {
        toast({ title: 'Error', description: 'Failed to delete review', variant: 'destructive' })
        return
      }
      toast({ title: 'Review Deleted', description: 'Your review has been removed.' })
      fetchReviews()
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    } finally {
      setDeletingReviewId(null)
    }
  }

  const openReviewForm = () => {
    if (userReview) {
      setReviewRating(userReview.rating)
      setReviewComment(userReview.comment || '')
    } else {
      setReviewRating(0)
      setReviewComment('')
    }
    setShowReviewForm(true)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 text-lib-purple animate-spin" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <p className="text-muted-foreground">Book not found</p>
        <button onClick={goBack} className="text-lib-purple dark:text-lib-purple-300 mt-2 text-sm font-medium">Go back</button>
      </div>
    )
  }

  const isAvailable = book.availableCopies > 0

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with decorative pattern */}
      <div className="bg-purple-gradient px-4 pt-4 pb-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 cover-pattern-overlay" />
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute bottom-4 -left-6 w-24 h-24 rounded-full bg-white/5" />

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-2 -ml-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white/70 text-sm">Book Details</span>
          </div>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Book cover overlapping header */}
      <div className="px-4 -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden"
        >
          {/* Cover with image or decorative pattern overlay */}
          {(() => {
            const coverSrc = getResourceCover(book.coverImage, book.title)
            return coverSrc ? (
              <div className="h-48 relative overflow-hidden cursor-pointer" onClick={() => setShowFullImage(true)}>
                <img src={coverSrc} alt={book.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {/* Category badge */}
                <Badge className="absolute top-3 right-3 bg-white/20 text-white border-0 hover:bg-white/30">
                  {book.category.charAt(0).toUpperCase() + book.category.slice(1)}
                </Badge>
                {/* Favorite button */}
                <button
                  onClick={handleFavorite}
                  className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all active:scale-90"
                  aria-label={hearted ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-5 h-5 transition-all ${hearted ? 'text-red-400 fill-red-400 scale-110' : 'text-white'}`} />
                </button>
              </div>
            ) : (
              <div className="h-48 bg-purple-gradient flex items-center justify-center relative cover-pattern-overlay">
                <BookOpen className="w-16 h-16 text-white/30" />
                <div className="absolute top-4 left-4 w-20 h-20 rounded-full border border-white/10" />
                <div className="absolute bottom-6 right-6 w-16 h-16 rounded-full border border-white/10" />
                <div className="absolute top-8 right-12 w-8 h-8 rounded-full bg-white/5" />
                <Badge className="absolute top-3 right-3 bg-white/20 text-white border-0 hover:bg-white/30">
                  {book.category.charAt(0).toUpperCase() + book.category.slice(1)}
                </Badge>
                <button
                  onClick={handleFavorite}
                  className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all active:scale-90"
                  aria-label={hearted ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-5 h-5 transition-all ${hearted ? 'text-red-400 fill-red-400 scale-110' : 'text-white'}`} />
                </button>
              </div>
            )
          })()}

          <div className="p-4">
            <h2 className="text-lg font-bold text-foreground leading-tight">{book.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{book.author}</p>

            {/* Availability + Shelf */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                isAvailable ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                {isAvailable ? `${book.availableCopies}/${book.totalCopies} available` : 'Unavailable'}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                Shelf {book.shelfLocation}
              </div>
            </div>

            {/* ISBN and Publication Date */}
            <div className="mt-3 flex flex-wrap gap-2">
              {book.isbn && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-xs text-muted-foreground">
                  <Hash className="w-3 h-3" />
                  <span className="font-medium">ISBN:</span> {book.isbn}
                </div>
              )}
              {book.publicationDate && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span className="font-medium">Published:</span> {book.publicationDate}
                </div>
              )}
              {book.subject && (
                <div className="px-2.5 py-1 rounded-lg bg-lib-purple-50 dark:bg-white/10 text-xs text-lib-purple dark:text-lib-purple-300 font-medium">
                  {book.subject}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">About this book</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{book.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {book.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300 text-[10px] font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Ratings & Reviews Section ─────────────────────────────── */}
      <div className="px-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-[22px] dark:shadow-sm p-4"
        >
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-lib-purple" />
            <h3 className="font-bold text-foreground text-sm">Ratings & Reviews</h3>
            <span className="text-[10px] text-muted-foreground ml-auto">{reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}</span>
          </div>

          {/* Rating Summary Card */}
          <div className="flex gap-4 items-start">
            {/* Left: big average */}
            <div className="flex flex-col items-center min-w-[72px]">
              <span className="text-3xl font-bold text-foreground">
                {reviewStats.totalReviews > 0 ? reviewStats.averageRating.toFixed(1) : '–'}
              </span>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(reviewStats.averageRating)
                        ? 'text-lib-purple dark:text-lib-purple-300 fill-lib-purple dark:fill-lib-purple-300'
                        : 'text-gray-200 dark:text-gray-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Right: distribution bars */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviewStats.distribution[star - 1]
                const pct = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-3 text-right">{star}</span>
                    <Star className="w-2.5 h-2.5 text-lib-purple dark:text-lib-purple-300 fill-lib-purple dark:fill-lib-purple-300" />
                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: 0.05 * star }}
                        className="h-full rounded-full bg-lib-purple"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-4 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Write a Review / Edit your Review button */}
          <div className="mt-4">
            {user && (
              <Button
                onClick={openReviewForm}
                variant="outline"
                className={`w-full h-10 rounded-xl text-sm font-semibold transition-colors ${
                  userReview
                    ? 'border-lib-purple-200 dark:border-lib-purple-700 text-lib-purple dark:text-lib-purple-300 hover:bg-lib-purple-50 dark:hover:bg-white/5'
                    : 'bg-lib-purple hover:bg-lib-purple-dark text-white border-0'
                }`}
              >
                {userReview ? (
                  <span className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit your review
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Write a Review
                  </span>
                )}
              </Button>
            )}

            {/* Inline Review Form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-3">
                    {/* Star Selector */}
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1.5">Your Rating</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            onClick={() => setReviewRating(s)}
                            className="p-0.5 transition-transform active:scale-90"
                            aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                s <= reviewRating
                                  ? 'text-lib-purple dark:text-lib-purple-300 fill-lib-purple dark:fill-lib-purple-300'
                                  : 'text-gray-200 dark:text-gray-700 hover:text-lib-purple-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment Textarea */}
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1.5">Comment <span className="text-muted-foreground font-normal">(optional)</span></p>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value.slice(0, 200))}
                        placeholder="Share your thoughts about this book..."
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a0e2e] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-lib-purple/30 focus:border-lib-purple resize-none transition-colors"
                      />
                      <p className="text-[10px] text-muted-foreground text-right mt-0.5">{reviewComment.length}/200</p>
                    </div>

                    {/* Submit / Cancel */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={reviewRating === 0 || submittingReview}
                        className="flex-1 h-9 rounded-lg bg-lib-purple hover:bg-lib-purple-dark text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {submittingReview ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                          </span>
                        ) : (
                          'Submit Review'
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowReviewForm(false)
                          setReviewRating(0)
                          setReviewComment('')
                        }}
                        variant="outline"
                        className="h-9 px-4 rounded-lg text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reviews List */}
          <div className="mt-4 max-h-96 overflow-y-auto custom-scrollbar">
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 relative"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Avatar initials circle */}
                      <div className="w-8 h-8 rounded-full bg-lib-purple/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-lib-purple dark:text-lib-purple-300">
                          {review.user.avatarInitials || review.user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + role badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{review.user.fullName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            review.user.role === 'faculty'
                              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                              : review.user.role === 'student'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                          }`}>
                            {review.user.role.charAt(0).toUpperCase() + review.user.role.slice(1)}
                          </span>
                        </div>

                        {/* Star rating */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= review.rating ? 'text-lib-purple dark:text-lib-purple-300 fill-lib-purple dark:fill-lib-purple-300' : 'text-gray-200 dark:text-gray-700'
                              }`}
                            />
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-1">{formatDate(review.createdAt)}</span>
                        </div>

                        {/* Comment */}
                        {review.comment && (
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{review.comment}</p>
                        )}
                      </div>

                      {/* Delete button for own review */}
                      {user?.id === review.userId && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                          aria-label="Delete review"
                        >
                          {deletingReviewId === review.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <div className="px-4 mt-4 flex gap-3">
        {isAvailable ? (
          <>
            <Button
              onClick={handleStartReading}
              disabled={startingReading}
              className="flex-1 h-12 rounded-xl font-semibold text-base bg-lib-purple hover:bg-lib-purple-dark text-white"
            >
              {startingReading ? (
                <span className="flex items-center gap-2">
                  <motion.div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Starting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Library className="w-4 h-4" /> Read Here
                </span>
              )}
            </Button>
            <Button
              onClick={handleBorrow}
              disabled={borrowing}
              variant="outline"
              className="flex-1 h-12 rounded-xl font-semibold text-base border-lib-purple-200 dark:border-lib-purple-700 text-lib-purple dark:text-lib-purple-300 hover:bg-lib-purple-50 dark:hover:bg-white/5"
            >
              {borrowing ? (
                <span className="flex items-center gap-2">
                  <motion.div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Borrowing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Take Home
                </span>
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleReserve}
            disabled={reserving}
            className="flex-1 h-12 rounded-xl font-semibold text-base bg-lib-purple-50 dark:bg-white/10 text-lib-purple dark:text-lib-purple-300 hover:bg-lib-purple-100 dark:hover:bg-white/15"
          >
            {reserving ? (
              <span className="flex items-center gap-2">
                <motion.div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" /> Reserve
              </span>
            )}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleShare}
          className="h-12 px-4 rounded-xl border-lib-purple-200 dark:border-lib-purple-700 text-lib-purple dark:text-lib-purple-300 hover:bg-lib-purple-50 dark:hover:bg-white/5"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Related books from API */}
      <div className="px-4 mt-6 flex-1 overflow-y-auto">
        <h3 className="font-bold text-foreground mb-3">More Resources</h3>
        <div className="bg-card rounded-[22px] dark:shadow-sm overflow-hidden">
          {relatedBooks.length > 0 ? (
            relatedBooks.map((relBook, index) => (
              <button
                key={relBook.id}
                onClick={() => { setSelectedBookId(relBook.id); setCurrentScreen('book-detail') }}
                className={`flex items-center gap-3 w-full px-4 py-3 hover:bg-lib-purple-50/50 active:bg-lib-purple-50 transition-colors ${
                  index < relatedBooks.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-purple-gradient flex items-center justify-center flex-shrink-0 cover-pattern-overlay">
                  <BookOpen className="w-4 h-4 text-white/50" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">{relBook.title}</h4>
                  <p className="text-[10px] text-muted-foreground">{relBook.author}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No other resources found
            </div>
          )}
        </div>
        <div className="h-24" />
      </div>

      {/* Full-screen image viewer */}
      <AnimatePresence>
        {showFullImage && (() => {
          const coverSrc = book ? getResourceCover(book.coverImage, book.title) : null
          return coverSrc ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
              onClick={() => setShowFullImage(false)}
            >
              <button
                onClick={() => setShowFullImage(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                src={coverSrc}
                alt={book?.title || 'Book cover'}
                className="max-w-[90%] max-h-[80vh] object-contain rounded-2xl dark:shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          ) : null
        })()}
      </AnimatePresence>

      {/* Share toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium dark:shadow-lg z-50"
          >
            Copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
