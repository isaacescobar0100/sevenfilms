import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X, MessageCircle, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '../../utils/formatters'
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '../../hooks/useComments'
import { useUserReaction, usePostReactions, usePostReactionUsers, useToggleReaction, REACTIONS } from '../../hooks/usePostReactions'
import { useAuthStore } from '../../store/authStore'
import { useMultipleRateLimits } from '../../hooks/useRateLimit'
import { extractMentions, notifyMentionedUsers } from '../../hooks/useMentions'
import EmojiGifPicker from '../common/EmojiGifPicker'
import ConfirmDialog from '../common/ConfirmDialog'
import MediaLightbox from '../common/MediaLightbox'
import PostVideoPlayer from '../common/PostVideoPlayer'
import ReactionPicker, { ReactionIcons } from '../common/ReactionPicker'
import MentionInput from '../common/MentionInput'
import CommentItem from './CommentItem'

function PostDetailPanel({ post, isOpen, onClose, initialTab = 'comments' }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [commentText, setCommentText] = useState('')
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showCommentMenu, setShowCommentMenu] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const [showLightbox, setShowLightbox] = useState(false)
  // Estados para respuestas anidadas
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const panelRef = useRef(null)
  const commentsEndRef = useRef(null)

  const { data: currentReaction, isLoading: reactionLoading } = useUserReaction(post?.id)
  const { data: reactionsData } = usePostReactions(post?.id)
  const { data: reactionUsers, isLoading: reactionUsersLoading } = usePostReactionUsers(isOpen ? post?.id : null)
  const toggleReaction = useToggleReaction()
  const { data: comments, isLoading: commentsLoading } = useComments(isOpen ? post?.id : null)
  const createComment = useCreateComment()
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()
  const rateLimits = useMultipleRateLimits(['reactionActions', 'commentActions'])

  // Update active tab when initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [initialTab, isOpen])

  // Scroll to bottom when comments load
  useEffect(() => {
    if (comments && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !post) return null

  const handleReaction = (reactionType) => {
    if (reactionLoading) return
    if (!rateLimits.reactionActions?.canPerformAction) {
      alert(`Has alcanzado el límite de reacciones por minuto. Espera un momento.`)
      return
    }
    toggleReaction.mutate({
      postId: post.id,
      reactionType,
      currentReaction,
      postOwnerId: post.user_id
    })
    rateLimits.reactionActions?.performAction()
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    if (!rateLimits.commentActions.canPerformAction) {
      alert(`Has alcanzado el límite de ${rateLimits.commentActions.limit} comentarios por minuto.`)
      return
    }
    try {
      const content = commentText.trim()
      const result = await createComment.mutateAsync({
        postId: post.id,
        content,
        postOwnerId: post.user_id,
      })

      // Procesar menciones y enviar notificaciones
      const mentions = extractMentions(content)
      if (mentions.length > 0 && result) {
        await notifyMentionedUsers(mentions, user.id, 'comment', result.id, post.id)
      }

      rateLimits.commentActions.performAction()
      setCommentText('')
    } catch (err) {
      console.error('Error creating comment:', err)
    }
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

  // Manejar envío de respuesta anidada
  const handleSubmitReply = async (parentComment) => {
    if (!replyText.trim()) return
    if (!rateLimits.commentActions.canPerformAction) {
      alert(`Has alcanzado el límite de ${rateLimits.commentActions.limit} comentarios por minuto.`)
      return
    }
    try {
      const content = replyText.trim()
      const result = await createComment.mutateAsync({
        postId: post.id,
        content,
        postOwnerId: post.user_id,
        parentId: parentComment.id,
        parentUserId: parentComment.user_id,
      })

      // Procesar menciones y enviar notificaciones
      const mentions = extractMentions(content)
      if (mentions.length > 0 && result) {
        await notifyMentionedUsers(mentions, user.id, 'comment', result.id, post.id)
      }

      rateLimits.commentActions.performAction()
      setReplyText('')
      setReplyingTo(null)
    } catch (err) {
      console.error('Error creating reply:', err)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Main content area - shows post media */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        {post.media_url && (
          <div className="max-w-4xl max-h-[90vh] w-full">
            {post.media_type === 'video' ? (
              <PostVideoPlayer
                src={post.media_url}
                className="rounded-lg overflow-hidden"
              />
            ) : (
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full max-h-[85vh] object-contain rounded-lg cursor-pointer"
                onClick={() => setShowLightbox(true)}
              />
            )}
          </div>
        )}
        {!post.media_url && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-lg">
            <p className="text-gray-900 dark:text-white text-lg whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
        )}
      </div>

      {/* Side Panel */}
      <div
        ref={panelRef}
        className="w-full max-w-md bg-white dark:bg-gray-800 h-full flex flex-col relative z-10 shadow-2xl animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${post.username}`} onClick={onClose}>
              {post.avatar_url ? (
                <img src={post.avatar_url} alt={post.username} className="h-10 w-10 rounded-full" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                  {post.full_name?.[0] || post.username?.[0] || 'U'}
                </div>
              )}
            </Link>
            <div>
              <Link to={`/profile/${post.username}`} onClick={onClose} className="font-semibold text-gray-900 dark:text-white hover:underline">
                {post.full_name || post.username}
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(post.created_at)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Post content if there's media */}
        {post.media_url && post.content && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">{post.content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-6">
          <ReactionPicker
            currentReaction={currentReaction}
            onReact={handleReaction}
            reactionCounts={reactionsData?.counts || {}}
            totalReactions={reactionsData?.total || 0}
            disabled={reactionLoading || toggleReaction.isPending}
          />
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center space-x-2 transition-colors ${activeTab === 'comments' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400 hover:text-primary-600'}`}
          >
            <MessageCircle className="h-6 w-6" />
            <span className="font-medium">{post.comments_count || 0}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'comments'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('post.comments')} ({post.comments_count || 0})
          </button>
          <button
            onClick={() => setActiveTab('reactions')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'reactions'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Reacciones ({reactionsData?.total || 0})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'comments' && (
            <div className="p-4 space-y-4">
              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onClose={onClose}
                    onEdit={handleEditComment}
                    onDelete={(id) => {
                      setCommentToDelete(id)
                      setShowDeleteCommentDialog(true)
                    }}
                    onReply={(comment) => {
                      setCommentText(`@${comment.profiles?.username} `)
                    }}
                    editingComment={editingComment}
                    editCommentText={editCommentText}
                    setEditCommentText={setEditCommentText}
                    onSaveComment={handleSaveComment}
                    onCancelEdit={() => {
                      setEditingComment(null)
                      setEditCommentText('')
                    }}
                    // Props para respuestas anidadas
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    onSubmitReply={handleSubmitReply}
                    isSubmittingReply={createComment.isPending}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">{t('post.noComments')}</p>
                </div>
              )}
              <div ref={commentsEndRef} />
            </div>
          )}

          {activeTab === 'reactions' && (
            <div className="p-4">
              {reactionUsersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : reactionUsers && reactionUsers.length > 0 ? (
                <div className="space-y-3">
                  {reactionUsers.map((reaction, index) => {
                    const reactionInfo = REACTIONS[reaction.reaction_type]
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <Link
                          to={`/profile/${reaction.profiles?.username}`}
                          onClick={onClose}
                          className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors flex-1"
                        >
                          {reaction.profiles?.avatar_url ? (
                            <img
                              src={reaction.profiles.avatar_url}
                              alt={reaction.profiles.username}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300">
                              {reaction.profiles?.username?.[0] || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {reaction.profiles?.full_name || reaction.profiles?.username}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{reaction.profiles?.username}
                            </p>
                          </div>
                        </Link>
                        <div
                          className="flex items-center space-x-2 px-3 py-1.5 rounded-full"
                          style={{ backgroundColor: `${reactionInfo?.color}20` }}
                        >
                          {ReactionIcons[reaction.reaction_type] && (
                            <div className="w-5 h-5" style={{ color: reactionInfo?.color }}>
                              {ReactionIcons[reaction.reaction_type]({
                                className: "w-5 h-5",
                                isActive: true,
                                isHovered: false
                              })}
                            </div>
                          )}
                          <span className="text-sm font-medium" style={{ color: reactionInfo?.color }}>
                            {reactionInfo?.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🎬</div>
                  <p className="text-gray-500 dark:text-gray-400">Aún no hay reacciones</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Sé el primero en reaccionar</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment input */}
        {activeTab === 'comments' && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <form onSubmit={handleComment} className="flex items-center space-x-2">
              <EmojiGifPicker
                onSelect={(emoji) => setCommentText(prev => prev + emoji)}
                onGifSelect={(gifUrl) => {
                  createComment.mutate({
                    postId: post.id,
                    content: gifUrl,
                    postOwnerId: post.user_id,
                    isGif: true,
                  })
                }}
                onStickerSelect={(stickerUrl) => {
                  createComment.mutate({
                    postId: post.id,
                    content: stickerUrl,
                    postOwnerId: post.user_id,
                    isGif: true,
                  })
                }}
                position="top"
              />
              <MentionInput
                value={commentText}
                onChange={setCommentText}
                placeholder={t('post.writeComment') + ' (usa @ para mencionar)'}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || createComment.isPending}
                className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Delete Comment Dialog */}
      <ConfirmDialog
        isOpen={showDeleteCommentDialog}
        onClose={() => { setShowDeleteCommentDialog(false); setCommentToDelete(null) }}
        onConfirm={handleDeleteComment}
        title={t('post.deleteComment')}
        message={t('post.deleteCommentConfirm')}
        confirmText={t('common.delete')}
        type="danger"
      />

      {/* Media Lightbox */}
      {post.media_url && post.media_type === 'image' && (
        <MediaLightbox
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          mediaUrl={post.media_url}
          mediaType="image"
        />
      )}
    </div>,
    document.body
  )
}

export default PostDetailPanel
