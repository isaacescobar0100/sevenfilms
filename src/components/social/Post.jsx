import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Link as LinkIcon, Check, Edit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '../../utils/formatters'
import { useToggleLike, useHasLiked } from '../../hooks/useLikes'
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '../../hooks/useComments'
import { useDeletePost, useUpdatePost } from '../../hooks/usePosts'
import { useAuthStore } from '../../store/authStore'
import ConfirmDialog from '../common/ConfirmDialog'
import { useMultipleRateLimits } from '../../hooks/useRateLimit'

function Post({ post }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCommentMenu, setShowCommentMenu] = useState(null)
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [editingPost, setEditingPost] = useState(false)
  const [editPostText, setEditPostText] = useState('')

  const { data: hasLiked, isLoading: likeLoading } = useHasLiked(post.id)
  const toggleLike = useToggleLike()
  const { data: comments } = useComments(showComments ? post.id : null)
  const createComment = useCreateComment()
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const deletePost = useDeletePost()
  const updatePost = useUpdatePost()

  const rateLimits = useMultipleRateLimits(['likeActions', 'commentActions'])

  const isOwnPost = user?.id === post.user_id

  const handleLike = () => {
    if (likeLoading) return

    // Verificar rate limit para likes
    if (!rateLimits.likeActions.canPerformAction) {
      alert(`Has alcanzado el límite de ${rateLimits.likeActions.limit} likes por minuto. Espera un momento.`)
      return
    }

    toggleLike.mutate({ postId: post.id, hasLiked, postOwnerId: post.user_id })
    rateLimits.likeActions.performAction()
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    // Verificar rate limit para comentarios
    if (!rateLimits.commentActions.canPerformAction) {
      alert(`Has alcanzado el límite de ${rateLimits.commentActions.limit} comentarios por minuto. Espera un momento.`)
      return
    }

    try {
      await createComment.mutateAsync({
        postId: post.id,
        content: commentText.trim(),
        postOwnerId: post.user_id,
      })
      rateLimits.commentActions.performAction()
      setCommentText('')
    } catch (err) {
      console.error('Error creating comment:', err)
    }
  }

  const handleEditPost = () => {
    setEditingPost(true)
    setEditPostText(post.content)
    setShowMenu(false)
  }

  const handleSaveEditPost = async () => {
    if (!editPostText.trim()) return

    try {
      await updatePost.mutateAsync({
        id: post.id,
        content: editPostText.trim(),
      })
      setEditingPost(false)
      setEditPostText('')
    } catch (err) {
      console.error('Error updating post:', err)
    }
  }

  const handleCancelEditPost = () => {
    setEditingPost(false)
    setEditPostText('')
  }

  const handleDeletePost = async () => {
    try {
      await deletePost.mutateAsync(post.id)
      setShowMenu(false)
    } catch (err) {
      console.error('Error deleting post:', err)
    }
  }

  const getPostUrl = () => {
    return `${window.location.origin}/feed?post=${post.id}`
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPostUrl())
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowShareMenu(false)
      }, 2000)
    } catch (err) {
      console.error('Error copying link:', err)
    }
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${post.content}\n\n${getPostUrl()}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
    setShowShareMenu(false)
  }

  const handleShareFacebook = () => {
    const url = encodeURIComponent(getPostUrl())
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    setShowShareMenu(false)
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(post.content)
    const url = encodeURIComponent(getPostUrl())
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
    setShowShareMenu(false)
  }

  const handleEditComment = (comment) => {
    setEditingComment(comment.id)
    setEditCommentText(comment.content)
    setShowCommentMenu(null)
  }

  const handleSaveComment = async (commentId) => {
    if (!editCommentText.trim()) return

    try {
      await updateComment.mutateAsync({
        id: commentId,
        content: editCommentText.trim(),
        postId: post.id,
      })
      setEditingComment(null)
      setEditCommentText('')
    } catch (err) {
      console.error('Error updating comment:', err)
    }
  }

  const handleCancelEdit = () => {
    setEditingComment(null)
    setEditCommentText('')
  }

  const handleDeleteComment = async () => {
    if (!commentToDelete) return

    try {
      await deleteComment.mutateAsync({ id: commentToDelete, postId: post.id })
      setCommentToDelete(null)
      setShowDeleteCommentDialog(false)
    } catch (err) {
      console.error('Error deleting comment:', err)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.username}`}>
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt={post.username}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {post.full_name?.[0] || post.username?.[0] || 'U'}
              </div>
            )}
          </Link>
          <div>
            <Link
              to={`/profile/${post.username}`}
              className="font-semibold hover:underline"
            >
              {post.full_name || post.username}
            </Link>
            <p className="text-sm text-gray-500">@{post.username}</p>
          </div>
        </div>

        {/* Menu */}
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setShowMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                  <button
                    onClick={handleEditPost}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>{t('common.edit')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteDialog(true)
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{t('post.delete')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {editingPost ? (
          <div className="space-y-2">
            <textarea
              value={editPostText}
              onChange={(e) => setEditPostText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEditPost}
                disabled={!editPostText.trim() || updatePost.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatePost.isPending ? t('common.loading') : t('common.save')}
              </button>
              <button
                onClick={handleCancelEditPost}
                disabled={updatePost.isPending}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {/* Media */}
      {post.media_type === 'image' && post.media_url && (
        <img
          src={post.media_url}
          alt="Post media"
          className="w-full max-h-96 object-cover"
        />
      )}
      {post.media_type === 'video' && post.media_url && (
        <video src={post.media_url} className="w-full max-h-96" controls />
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-gray-600">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center space-x-2 hover:text-red-600 ${
              hasLiked ? 'text-red-600' : ''
            }`}
          >
            <Heart className={`h-5 w-5 ${hasLiked ? 'fill-current' : ''}`} />
            <span>{post.likes_count || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 hover:text-primary-600"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{post.comments_count || 0}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center space-x-2 hover:text-primary-600"
            >
              <Share2 className="h-5 w-5" />
            </button>

            {/* Share Menu */}
            {showShareMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowShareMenu(false)}
                ></div>
                <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-lg shadow-lg py-2 z-20 border border-gray-200">
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                  >
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>{t('post.shareWhatsApp')}</span>
                  </button>

                  <button
                    onClick={handleShareFacebook}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                  >
                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>{t('post.shareFacebook')}</span>
                  </button>

                  <button
                    onClick={handleShareTwitter}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                  >
                    <svg className="h-5 w-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>{t('post.shareTwitter')}</span>
                  </button>

                  <div className="border-t border-gray-200 my-1"></div>

                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-green-600">{t('post.copied')}</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-5 w-5 text-gray-600" />
                        <span>{t('post.copyLink')}</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {formatRelativeTime(post.created_at)}
        </p>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-gray-200 px-4 py-3">
          {/* Comment form */}
          <form onSubmit={handleComment} className="flex space-x-2 mb-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t('post.writeComment')}
              className="flex-1 input"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || createComment.isPending}
              className="btn btn-primary"
            >
              {t('post.comment')}
            </button>
          </form>

          {/* Comments list */}
          <div className="space-y-3">
            {comments?.map((comment) => (
              <div key={comment.id} className="flex space-x-2">
                <div className="flex-shrink-0">
                  {comment.profiles?.avatar_url ? (
                    <img
                      src={comment.profiles.avatar_url}
                      alt={comment.profiles.username}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm">
                      {comment.profiles?.username?.[0] || 'U'}
                    </div>
                  )}
                </div>

                {editingComment === comment.id ? (
                  <div className="flex-1 flex space-x-2">
                    <input
                      type="text"
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      className="flex-1 input"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveComment(comment.id)}
                      disabled={!editCommentText.trim() || updateComment.isPending}
                      className="btn btn-primary px-3"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn btn-secondary px-3"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                      <Link
                        to={`/profile/${comment.profiles?.username}`}
                        className="font-semibold text-sm hover:underline"
                      >
                        {comment.profiles?.full_name || comment.profiles?.username}
                      </Link>
                      <p className="text-sm text-gray-900">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(comment.created_at)}
                      </p>
                    </div>
                    {user?.id === comment.user_id && (
                      <div className="relative">
                        <button
                          onClick={() => setShowCommentMenu(showCommentMenu === comment.id ? null : comment.id)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {showCommentMenu === comment.id && (
                          <>
                            <div
                              className="fixed inset-0"
                              onClick={() => setShowCommentMenu(null)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200">
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <Edit className="h-4 w-4" />
                                <span>{t('common.edit')}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCommentToDelete(comment.id)
                                  setShowDeleteCommentDialog(true)
                                  setShowCommentMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{t('common.delete')}</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Post Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeletePost}
        title={t('post.delete')}
        message={t('post.deleteConfirm')}
        confirmText={t('common.delete')}
        type="danger"
      />

      {/* Delete Comment Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteCommentDialog}
        onClose={() => {
          setShowDeleteCommentDialog(false)
          setCommentToDelete(null)
        }}
        onConfirm={handleDeleteComment}
        title={t('post.deleteComment')}
        message={t('post.deleteCommentConfirm')}
        confirmText={t('common.delete')}
        type="danger"
      />
    </div>
  )
}

export default Post
