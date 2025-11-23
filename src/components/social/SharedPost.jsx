import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Share2, Trash2, MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '../../utils/formatters'
import { useAuthStore } from '../../store/authStore'
import { useDeleteSharedPost } from '../../hooks/useSharedPosts'
import Post from './Post'
import ConfirmDialog from '../common/ConfirmDialog'

function SharedPost({ sharedPost }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteSharedPost = useDeleteSharedPost()

  if (!sharedPost || !sharedPost.original_post) return null

  const isOwner = user?.id === sharedPost.user_id
  const sharer = sharedPost.sharer || {}
  const originalPost = sharedPost.original_post

  // Preparar el post original con datos del perfil
  const postData = {
    ...originalPost,
    username: originalPost.profiles?.username || 'Usuario',
    full_name: originalPost.profiles?.full_name || 'Usuario Sin Nombre',
    avatar_url: originalPost.profiles?.avatar_url || null,
  }

  const handleDelete = async () => {
    try {
      await deleteSharedPost.mutateAsync(sharedPost.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting shared post:', error)
    }
  }

  // Renderizar menciones en el comentario
  const renderComment = (text) => {
    if (!text) return null

    // Buscar menciones @username
    const parts = text.split(/(@\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1)
        return (
          <Link
            key={index}
            to={`/profile/${username}`}
            className="text-primary-600 hover:underline font-medium"
          >
            {part}
          </Link>
        )
      }
      return part
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header del compartido */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Share2 className="h-4 w-4" />
            <Link
              to={`/profile/${sharer.username}`}
              className="font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600"
            >
              {sharer.full_name || sharer.username || 'Usuario'}
            </Link>
            <span>{t('shared.sharedThis', 'compartió esto')}</span>
            <span>·</span>
            <span>{formatRelativeTime(sharedPost.created_at)}</span>
          </div>

          {/* Menú de opciones (solo para el dueño) */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        setShowDeleteDialog(true)
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('shared.delete', 'Eliminar compartido')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Comentario del que compartió */}
        {sharedPost.comment && (
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            {renderComment(sharedPost.comment)}
          </p>
        )}
      </div>

      {/* Post original (con borde para diferenciarlo) */}
      <div className="mx-3 my-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <Post post={postData} isSharedView />
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title={t('shared.deleteTitle', 'Eliminar compartido')}
        message={t('shared.deleteMessage', '¿Estás seguro de que quieres eliminar este compartido?')}
        confirmText={t('common.delete', 'Eliminar')}
        type="danger"
      />
    </div>
  )
}

export default SharedPost
