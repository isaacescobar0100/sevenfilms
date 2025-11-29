import { useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { MoreVertical, Edit, Trash2, MessageCircle, Send, X, BadgeCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '../../utils/formatters'
import { useAuthStore } from '../../store/authStore'
import { useCommentReactions, useUserCommentReaction, useToggleCommentReaction } from '../../hooks/useCommentReactions'
import CommentReactionPicker from '../common/CommentReactionPicker'
import MentionInput from '../common/MentionInput'
import CommentContent from '../common/CommentContent'

const CommentItem = memo(function CommentItem({
  comment,
  onClose,
  onEdit,
  onDelete,
  onReply,
  editingComment,
  editCommentText,
  setEditCommentText,
  onSaveComment,
  onCancelEdit,
  // Props para respuestas anidadas
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  onSubmitReply,
  isSubmittingReply,
  depth = 0,
}) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)

  // Hooks de reacciones para este comentario
  const { data: reactionsData } = useCommentReactions(comment.id)
  const { data: userReaction } = useUserCommentReaction(comment.id)
  const toggleReaction = useToggleCommentReaction()

  const isOwn = user?.id === comment.user_id
  const isEditing = editingComment === comment.id
  const isReplying = replyingTo === comment.id
  const maxDepth = 2 // Máximo nivel de anidación

  const handleReaction = (reactionType) => {
    toggleReaction.mutate({
      commentId: comment.id,
      reactionType,
      currentReaction: userReaction,
    })
  }

  const handleEdit = () => {
    onEdit(comment)
    setShowMenu(false)
  }

  const handleDelete = () => {
    onDelete(comment.id)
    setShowMenu(false)
  }

  const handleReplyClick = () => {
    if (setReplyingTo) {
      setReplyingTo(comment.id)
      setReplyText?.('')
    } else {
      // Fallback al comportamiento anterior si no hay soporte para respuestas anidadas
      onReply?.(comment)
    }
  }

  const handleSubmitReply = (e) => {
    e.preventDefault()
    if (replyText?.trim() && onSubmitReply) {
      onSubmitReply(comment)
    }
  }

  const handleCancelReply = () => {
    setReplyingTo?.(null)
    setReplyText?.('')
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-3' : ''}`}>
      <div className="flex space-x-3">
        {/* Avatar */}
        <Link to={`/profile/${comment.profiles?.username}`} onClick={onClose} className="flex-shrink-0">
          {comment.profiles?.avatar_url ? (
            <img
              src={comment.profiles.avatar_url}
              alt={comment.profiles.username}
              className={`${depth > 0 ? 'h-6 w-6' : 'h-8 w-8'} rounded-full object-cover`}
            />
          ) : (
            <div className={`${depth > 0 ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm'} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium`}>
              {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            /* Modo edición */
            <div className="space-y-2">
              <input
                type="text"
                value={editCommentText}
                onChange={(e) => setEditCommentText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onSaveComment(comment.id)}
                  disabled={!editCommentText.trim()}
                  className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {t('common.save')}
                </button>
                <button
                  onClick={onCancelEdit}
                  className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            /* Vista normal */
            <div>
              {/* Burbuja del comentario */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2 inline-block max-w-full">
                {/* Header con nombre y menú */}
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/profile/${comment.profiles?.username}`}
                    onClick={onClose}
                    className="font-semibold text-sm text-gray-900 dark:text-white hover:underline flex items-center gap-1"
                  >
                    {comment.profiles?.full_name || comment.profiles?.username}
                    {comment.profiles?.verified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    )}
                  </Link>

                  {/* Menú de opciones (solo para comentarios propios) */}
                  {isOwn && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {showMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-visible z-20 border border-gray-200 dark:border-gray-700">
                            <button
                              onClick={handleEdit}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="whitespace-nowrap">{t('common.edit')}</span>
                            </button>
                            <button
                              onClick={handleDelete}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="whitespace-nowrap">{t('common.delete')}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Contenido del comentario */}
                {comment.content?.match(/\.(gif|giphy\.com)/i) ? (
                  <img
                    src={comment.content}
                    alt="GIF"
                    className="max-w-[200px] max-h-[150px] rounded-lg mt-1"
                    loading="lazy"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5 break-words whitespace-pre-wrap">
                    <CommentContent content={comment.content} onLinkClick={onClose} />
                  </p>
                )}
              </div>

              {/* Acciones debajo del comentario */}
              <div className="flex items-center space-x-4 mt-1 ml-1">
                {/* Reacciones */}
                <CommentReactionPicker
                  currentReaction={userReaction}
                  onReact={handleReaction}
                  reactionCounts={reactionsData?.counts || {}}
                  totalReactions={reactionsData?.total || 0}
                  disabled={toggleReaction.isPending}
                />

                {/* Responder (solo si no excede el nivel máximo) */}
                {depth < maxDepth && (
                  <button
                    onClick={handleReplyClick}
                    className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Responder</span>
                  </button>
                )}

                {/* Tiempo */}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatRelativeTime(comment.created_at)}
                </span>
              </div>

              {/* Input de respuesta inline */}
              {isReplying && (
                <form onSubmit={handleSubmitReply} className="mt-2 flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <MentionInput
                      value={replyText || ''}
                      onChange={(val) => setReplyText?.(val)}
                      placeholder={`Responder a ${comment.profiles?.username}... (@ para mencionar)`}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCancelReply}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!replyText?.trim() || isSubmittingReply}
                    className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Respuestas anidadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onClose={onClose}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              editingComment={editingComment}
              editCommentText={editCommentText}
              setEditCommentText={setEditCommentText}
              onSaveComment={onSaveComment}
              onCancelEdit={onCancelEdit}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={onSubmitReply}
              isSubmittingReply={isSubmittingReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
})

export default CommentItem
