import { useState, useEffect, useRef } from 'react'
import { X, Share2, Send, Search, AtSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { useSharePost } from '../../hooks/useSharedPosts'
import { supabase } from '../../lib/supabase'

function SharePostModal({ post, isOpen, onClose }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('own') // 'own' o 'friend'
  const [comment, setComment] = useState('')
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionResults, setMentionResults] = useState([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const [following, setFollowing] = useState([])
  const [loadingFollowing, setLoadingFollowing] = useState(false)
  const textareaRef = useRef(null)

  const sharePost = useSharePost()

  // Cargar seguidos cuando se abre el modal
  useEffect(() => {
    const loadFollowing = async () => {
      if (!user?.id || !isOpen) return

      setLoadingFollowing(true)
      try {
        // Primero obtener los IDs de los usuarios seguidos
        const { data: followsData, error: followsError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)

        if (followsError) throw followsError
        if (!followsData || followsData.length === 0) {
          setFollowing([])
          return
        }

        const followingIds = followsData.map(f => f.following_id)

        // Luego obtener los perfiles de esos usuarios
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', followingIds)

        if (profilesError) throw profilesError

        // Formatear para que sea compatible con el componente
        const formattedFollowing = (profilesData || []).map(profile => ({
          following: profile
        }))

        setFollowing(formattedFollowing)
      } catch (error) {
        console.error('Error loading following:', error)
        setFollowing([])
      } finally {
        setLoadingFollowing(false)
      }
    }

    loadFollowing()
  }, [user?.id, isOpen])

  // Buscar usuarios para menciones
  useEffect(() => {
    const searchMentions = async () => {
      if (!mentionQuery || mentionQuery.length < 1) {
        setMentionResults([])
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${mentionQuery}%`)
        .limit(5)

      setMentionResults(data || [])
    }

    const debounce = setTimeout(searchMentions, 300)
    return () => clearTimeout(debounce)
  }, [mentionQuery])

  // Detectar @ para menciones
  const handleCommentChange = (e) => {
    const value = e.target.value
    const position = e.target.selectionStart
    setComment(value)
    setCursorPosition(position)

    // Buscar si hay una mención en progreso
    const textBeforeCursor = value.substring(0, position)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setShowMentions(true)
      setMentionQuery(mentionMatch[1])
    } else {
      setShowMentions(false)
      setMentionQuery('')
    }
  }

  // Insertar mención
  const insertMention = (username) => {
    const textBeforeCursor = comment.substring(0, cursorPosition)
    const textAfterCursor = comment.substring(cursorPosition)
    const mentionStart = textBeforeCursor.lastIndexOf('@')

    const newText = textBeforeCursor.substring(0, mentionStart) + `@${username} ` + textAfterCursor
    setComment(newText)
    setShowMentions(false)
    setMentionQuery('')

    // Enfocar textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newPosition = mentionStart + username.length + 2
        textareaRef.current.setSelectionRange(newPosition, newPosition)
      }
    }, 0)
  }

  // Filtrar amigos por búsqueda (solo mostrar si hay búsqueda)
  const filteredFriends = searchQuery.trim().length > 0
    ? following.filter(f =>
        f.following?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.following?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10) // Máximo 10 resultados
    : []

  const handleShare = async () => {
    if (activeTab === 'friend' && !selectedFriend) {
      return
    }

    try {
      await sharePost.mutateAsync({
        originalPostId: post.id,
        comment: comment.trim() || null,
        shareToUserId: activeTab === 'friend' ? selectedFriend.id : null,
      })
      onClose()
      setComment('')
      setSelectedFriend(null)
    } catch (error) {
      console.error('Error sharing post:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('share.title', 'Compartir publicación')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('own')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'own'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {t('share.ownProfile', 'Tu biografía')}
          </button>
          <button
            onClick={() => setActiveTab('friend')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'friend'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {t('share.friendProfile', 'Biografía de amigo')}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Vista previa del post original */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              {post.avatar_url ? (
                <img
                  src={post.avatar_url}
                  alt={post.username}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm">
                  {post.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {post.full_name || post.username}
                </p>
                <p className="text-xs text-gray-500">@{post.username}</p>
              </div>
            </div>
            {post.content && (
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {post.content}
              </p>
            )}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-2 rounded-lg overflow-hidden">
                <img
                  src={post.media_urls[0]}
                  alt="Post media"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
          </div>

          {/* Seleccionar amigo (solo en tab de amigo) */}
          {activeTab === 'friend' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('share.selectFriend', 'Selecciona un amigo')}
              </label>

              {/* Amigo seleccionado */}
              {selectedFriend && (
                <div className="flex items-center gap-3 p-2 mb-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-300 dark:border-primary-700">
                  {selectedFriend.avatar_url ? (
                    <img
                      src={selectedFriend.avatar_url}
                      alt={selectedFriend.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                      {selectedFriend.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedFriend.full_name || selectedFriend.username}
                    </p>
                    <p className="text-sm text-gray-500">@{selectedFriend.username}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFriend(null)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Búsqueda (solo si no hay amigo seleccionado) */}
              {!selectedFriend && (
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('share.searchFriends', 'Buscar amigos...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              )}

              {/* Lista de amigos (solo si no hay amigo seleccionado) */}
              {!selectedFriend && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {loadingFollowing ? (
                    <div className="flex justify-center py-4">
                      <span className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
                    </div>
                  ) : filteredFriends.length > 0 ? (
                    filteredFriends.map((follow) => (
                      <button
                        key={follow.following?.id}
                        onClick={() => {
                          setSelectedFriend(follow.following)
                          setSearchQuery('')
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {follow.following?.avatar_url ? (
                          <img
                            src={follow.following.avatar_url}
                            alt={follow.following.username}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                            {follow.following?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {follow.following?.full_name || follow.following?.username}
                          </p>
                          <p className="text-sm text-gray-500">@{follow.following?.username}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                      {searchQuery.trim().length === 0
                        ? t('share.typeToSearch', 'Escribe para buscar amigos...')
                        : following.length === 0
                          ? t('share.noFriends', 'No sigues a nadie todavía')
                          : t('share.noResults', 'No se encontraron resultados')
                      }
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comentario con menciones */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('share.addComment', 'Agregar comentario')}
              <span className="text-gray-400 font-normal ml-1">({t('share.optional', 'opcional')})</span>
            </label>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={comment}
                onChange={handleCommentChange}
                placeholder={t('share.commentPlaceholder', 'Escribe algo... usa @ para mencionar amigos')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />

              {/* Botón de mención */}
              <button
                onClick={() => {
                  const newComment = comment + '@'
                  setComment(newComment)
                  setShowMentions(true)
                  textareaRef.current?.focus()
                }}
                className="absolute right-2 bottom-2 p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title={t('share.mentionFriend', 'Mencionar amigo')}
              >
                <AtSign className="h-5 w-5" />
              </button>
            </div>

            {/* Dropdown de menciones */}
            {showMentions && mentionResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {mentionResults.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => insertMention(profile.username)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm">
                        {profile.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile.full_name || profile.username}
                      </p>
                      <p className="text-xs text-gray-500">@{profile.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            onClick={handleShare}
            disabled={sharePost.isPending || (activeTab === 'friend' && !selectedFriend)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sharePost.isPending ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t('share.share', 'Compartir')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SharePostModal
