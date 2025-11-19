import { useState } from 'react'
import { X, Trash2, Edit2, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import CustomVideoPlayer from './CustomVideoPlayer'
import MovieRatingStars from './MovieRatingStars'
import ConfirmDialog from '../common/ConfirmDialog'
import { useAuthStore } from '../../store/authStore'
import {
  useUserMovieRating,
  useMovieRatings,
  useUpsertMovieRating,
  useDeleteMovieRating,
} from '../../hooks/useMovieRatings'
import {
  useMovieComments,
  useCreateMovieComment,
  useUpdateMovieComment,
  useDeleteMovieComment,
} from '../../hooks/useMovieComments'

function MoviePlayerModal({ movie, onClose }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const [selectedRating, setSelectedRating] = useState(0)
  const [review, setReview] = useState('')
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, data: null })

  // Queries
  const { data: userRating } = useUserMovieRating(movie?.id)
  const { data: allRatings = [] } = useMovieRatings(movie?.id)
  const { data: comments = [] } = useMovieComments(movie?.id)

  // Mutations
  const upsertRating = useUpsertMovieRating()
  const deleteRating = useDeleteMovieRating()
  const createComment = useCreateMovieComment()
  const updateComment = useUpdateMovieComment()
  const deleteComment = useDeleteMovieComment()

  if (!movie) return null

  const locale = i18n.language === 'es' ? es : enUS

  const handleSubmitRating = async () => {
    if (selectedRating === 0) return

    try {
      await upsertRating.mutateAsync({
        movieId: movie.id,
        rating: selectedRating,
        review: review.trim() || null,
      })
      setShowRatingForm(false)
      setSelectedRating(0)
      setReview('')
    } catch (error) {
      console.error('Error submitting rating:', error)
      // Mostrar mensaje de error al usuario
      alert(error.message || t('movies.rating.cannotRateOwnMovie'))
    }
  }

  const handleDeleteRating = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'deleteRating',
      data: null
    })
  }

  const confirmDeleteRating = async () => {
    try {
      await deleteRating.mutateAsync(movie.id)
    } catch (error) {
      console.error('Error deleting rating:', error)
    }
  }

  const handleCreateComment = async () => {
    if (!commentText.trim()) return

    try {
      await createComment.mutateAsync({
        movieId: movie.id,
        content: commentText.trim(),
      })
      setCommentText('')
    } catch (error) {
      console.error('Error creating comment:', error)
      // Mostrar mensaje de error al usuario solo para errores reales
      alert(error.message || 'Error al agregar comentario')
    }
  }

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) return

    try {
      await updateComment.mutateAsync({
        commentId,
        content: editingCommentText.trim(),
        movieId: movie.id,
      })
      setEditingCommentId(null)
      setEditingCommentText('')
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const handleDeleteComment = (commentId) => {
    setConfirmDialog({
      isOpen: true,
      type: 'deleteComment',
      data: commentId
    })
  }

  const confirmDeleteComment = async () => {
    try {
      await deleteComment.mutateAsync({ commentId: confirmDialog.data, movieId: movie.id })
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id)
    setEditingCommentText(comment.content)
  }

  const cancelEditingComment = () => {
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  const ratingsWithReviews = allRatings.filter((r) => r.review)

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 pt-16">
        <div className="relative w-full max-w-4xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="fixed top-4 right-4 text-white hover:text-gray-300 transition-colors z-[60] bg-black bg-opacity-70 rounded-full p-3 shadow-lg"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Custom Video Player */}
          <CustomVideoPlayer movie={movie} />

          {/* Movie info */}
          <div className="bg-gray-900 text-white p-4 md:p-6 rounded-b-lg">
            <h2 className="text-xl md:text-2xl font-bold mb-3">{movie.title}</h2>

            <div className="flex items-center flex-wrap gap-2 text-sm text-gray-300 mb-4">
              {movie.year && (
                <>
                  <span className="font-semibold">{movie.year}</span>
                  <span>•</span>
                </>
              )}
              {movie.genre && (
                <>
                  <span className="bg-primary-600 px-3 py-1 rounded-full text-white">
                    {movie.genre}
                  </span>
                  <span>•</span>
                </>
              )}
              <span className="flex items-center space-x-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span>{movie.views || 0}</span>
              </span>
              {movie.completed_views > 0 && (
                <>
                  <span>•</span>
                  <span>{movie.completed_views} {t('movies.details.completedViews')}</span>
                </>
              )}
            </div>

            {/* Rating Display */}
            {movie.ratings_count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <MovieRatingStars
                  rating={movie.average_rating || 0}
                  size="lg"
                  showCount={true}
                  count={movie.ratings_count}
                />
                <span className="text-sm text-gray-400">
                  {movie.average_rating?.toFixed(1) || '0.0'} {t('movies.rating.averageRating')}
                </span>
              </div>
            )}

          {movie.duration && (
            <div className="text-sm text-gray-400 mb-4">
              Duración: {Math.floor(movie.duration / 60)}:{(movie.duration % 60).toString().padStart(2, '0')} minutos
            </div>
          )}

          {movie.description && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-2">Sinopsis</h3>
              <p className="text-gray-300 leading-relaxed">{movie.description}</p>
            </div>
          )}

          {/* Rating Section */}
          {user && (
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-3">{t('movies.rating.yourRating')}</h3>

              {/* Check if user is the movie owner */}
              {user.id === movie.user_id ? (
                <div className="bg-yellow-900/20 border border-yellow-600/50 p-4 rounded-lg flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-yellow-200 text-sm font-medium">
                      {t('movies.rating.ownerCannotRate')}
                    </p>
                  </div>
                </div>
              ) : userRating ? (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <MovieRatingStars rating={userRating.rating} size="lg" />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedRating(userRating.rating)
                          setReview(userRating.review || '')
                          setShowRatingForm(true)
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        {t('movies.rating.update')}
                      </button>
                      <button
                        onClick={handleDeleteRating}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        {t('movies.rating.delete')}
                      </button>
                    </div>
                  </div>
                  {userRating.review && (
                    <p className="text-gray-300 text-sm mt-2">{userRating.review}</p>
                  )}
                </div>
              ) : !showRatingForm ? (
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {t('movies.rating.rateThis')}
                </button>
              ) : null}

              {showRatingForm && (
                <div className="bg-gray-800 p-4 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('movies.rating.rateThis')}
                    </label>
                    <MovieRatingStars
                      rating={selectedRating}
                      size="xl"
                      interactive={true}
                      onRate={setSelectedRating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('movies.rating.writeReview')}
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder={t('movies.rating.reviewPlaceholder')}
                      className="w-full bg-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitRating}
                      disabled={selectedRating === 0 || upsertRating.isPending}
                      className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {upsertRating.isPending ? t('common.loading') : t('movies.rating.submit')}
                    </button>
                    <button
                      onClick={() => {
                        setShowRatingForm(false)
                        setSelectedRating(0)
                        setReview('')
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reviews Section */}
          {ratingsWithReviews.length > 0 && (
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-3">
                {t('movies.rating.ratings')} ({ratingsWithReviews.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {ratingsWithReviews.map((rating) => (
                  <div key={rating.id} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      {rating.profiles?.avatar_url ? (
                        <img
                          src={rating.profiles.avatar_url}
                          alt={rating.profiles.full_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                          {rating.profiles?.full_name?.[0] || 'U'}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{rating.profiles?.full_name}</p>
                          <MovieRatingStars rating={rating.rating} size="sm" />
                        </div>
                        <p className="text-gray-300 text-sm">{rating.review}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(rating.created_at), {
                            addSuffix: true,
                            locale,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-3">
              {t('movies.comments.title')} ({comments.length})
            </h3>

            {user && (
              <div className="mb-4">
                <div className="flex gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('movies.comments.writeComment')}
                    className="flex-1 bg-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                    rows={2}
                  />
                  <button
                    onClick={handleCreateComment}
                    disabled={!commentText.trim() || createComment.isPending}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 rounded-lg transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                {user.id === movie.user_id && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {t('movies.comments.creatorNote')}
                  </p>
                )}
              </div>
            )}

            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>{t('movies.comments.noComments')}</p>
                {user && <p className="text-sm mt-1">{t('movies.comments.beFirst')}</p>}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      {comment.profiles?.avatar_url ? (
                        <img
                          src={comment.profiles.avatar_url}
                          alt={comment.profiles.full_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                          {comment.profiles?.full_name?.[0] || 'U'}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{comment.profiles?.full_name}</p>
                          {user?.id === comment.user_id && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditingComment(comment)}
                                className="text-blue-400 hover:text-blue-300 p-1"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="w-full bg-gray-700 text-white rounded-lg p-2 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={updateComment.isPending}
                                className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded"
                              >
                                {t('common.save')}
                              </button>
                              <button
                                onClick={cancelEditingComment}
                                className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-300 text-sm">{comment.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale,
                              })}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {movie.profiles && (
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-2">Director</h3>
              <div className="flex items-center space-x-3">
                {movie.profiles.avatar_url ? (
                  <img
                    src={movie.profiles.avatar_url}
                    alt={movie.profiles.full_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
                    {movie.profiles.full_name?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{movie.profiles.full_name}</p>
                  <p className="text-sm text-gray-400">@{movie.profiles.username}</p>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'deleteRating'}
        onClose={() => setConfirmDialog({ isOpen: false, type: null, data: null })}
        onConfirm={confirmDeleteRating}
        title={t('movies.rating.delete')}
        message={t('movies.rating.deleteConfirm') || '¿Estás seguro de que quieres eliminar tu calificación?'}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'deleteComment'}
        onClose={() => setConfirmDialog({ isOpen: false, type: null, data: null })}
        onConfirm={confirmDeleteComment}
        title={t('movies.comments.delete')}
        message={t('movies.comments.deleteConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </div>
  )
}

export default MoviePlayerModal
