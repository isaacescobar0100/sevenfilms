import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, ArrowLeft, Trash2, MoreVertical, Edit, Trash, Loader2, X, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useConversations, useMessages, useSendMessage, useMarkAsRead, useRealtimeMessages, useDeleteConversation, useEditMessage, useDeleteMessageForMe, useDeleteMessageForEveryone } from '../hooks/useMessages'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmojiGifPicker from '../components/common/EmojiGifPicker'
import StoryViewer from '../components/stories/StoryViewer'
import { useStoryById, useStoryByMediaUrl } from '../hooks/useStories'
import { formatDistanceToNow } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import SEO from '../components/common/SEO'

function Messages() {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const location = useLocation()
  const [selectedUser, setSelectedUser] = useState(null)
  const [messageContent, setMessageContent] = useState('')
  const messagesEndRef = useRef(null)
  const [showConversationMenu, setShowConversationMenu] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState(null)
  const [showMessageMenu, setShowMessageMenu] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showDeleteMessageDialog, setShowDeleteMessageDialog] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState(null)
  const [deleteForEveryone, setDeleteForEveryone] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaPreview, setMediaPreview] = useState(null) // { file, url, type }
  const [storyToView, setStoryToView] = useState(null) // { storyId, storyOwnerId }
  const [mediaToView, setMediaToView] = useState(null) // { url, type, text } - para ver historia antigua

  const dateLocale = i18n.language === 'es' ? es : enUS

  const { data: conversations, isLoading: conversationsLoading } = useConversations()
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedUser?.id)
  const sendMessage = useSendMessage()
  const markAsRead = useMarkAsRead()
  const deleteConversation = useDeleteConversation()
  const editMessage = useEditMessage()
  const deleteMessageForMe = useDeleteMessageForMe()
  const deleteMessageForEveryone = useDeleteMessageForEveryone()

  // Obtener historia para ver desde mensaje (formato nuevo con IDs)
  const { data: storyData } = useStoryById(storyToView?.storyId, storyToView?.storyOwnerId)

  // Obtener historia por URL de media o texto (formato antiguo sin IDs)
  const { data: storyDataByUrl } = useStoryByMediaUrl(mediaToView?.url, mediaToView?.text)

  // Obtener perfil del usuario seleccionado desde la navegación
  const { data: preselectedUser } = useQuery({
    queryKey: ['profile-for-chat', location.state?.selectedUserId],
    queryFn: async () => {
      if (!location.state?.selectedUserId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', location.state.selectedUserId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!location.state?.selectedUserId,
  })

  // Seleccionar usuario automáticamente si viene de la navegación
  useEffect(() => {
    if (preselectedUser && !selectedUser) {
      setSelectedUser(preselectedUser)
    }
  }, [preselectedUser])

  // Realtime subscription
  useRealtimeMessages(selectedUser?.id)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (selectedUser?.id) {
      markAsRead.mutate(selectedUser.id)
    }
  }, [selectedUser?.id])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if ((!messageContent.trim() && !mediaPreview) || !selectedUser) return

    try {
      // If there's media, upload it first
      if (mediaPreview) {
        await uploadAndSendMedia(mediaPreview.file, messageContent.trim())
      } else {
        await sendMessage.mutateAsync({
          receiverId: selectedUser.id,
          content: messageContent.trim(),
        })
      }
      setMessageContent('')
      clearMediaPreview()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const clearMediaPreview = () => {
    if (mediaPreview?.url) {
      URL.revokeObjectURL(mediaPreview.url)
    }
    setMediaPreview(null)
  }

  const uploadAndSendMedia = async (file, caption = '') => {
    setUploadingMedia(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `chat/${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error } = await supabase.storage
        .from('movies')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('movies')
        .getPublicUrl(fileName)

      // Send media URL as message (with caption if provided)
      const content = caption ? `${publicUrl}\n${caption}` : publicUrl
      await sendMessage.mutateAsync({
        receiverId: selectedUser.id,
        content: content,
      })
    } catch (error) {
      console.error('Error uploading media:', error)
      alert(t('messages.uploadError') || 'Error al subir el archivo')
      throw error
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleDeleteConversation = () => {
    if (!conversationToDelete) return

    deleteConversation.mutate(conversationToDelete, {
      onSuccess: () => {
        if (selectedUser?.id === conversationToDelete) {
          setSelectedUser(null)
        }
        setShowDeleteDialog(false)
        setConversationToDelete(null)
        setShowConversationMenu(null)
      },
      onError: (error) => {
        console.error('Error deleting conversation:', error)
        setShowDeleteDialog(false)
      }
    })
  }

  const handleEditMessage = (message) => {
    setEditingMessage(message.id)
    setEditContent(message.content)
    setShowMessageMenu(null)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editingMessage) return

    try {
      await editMessage.mutateAsync({
        messageId: editingMessage,
        content: editContent.trim(),
      })
      setEditingMessage(null)
      setEditContent('')
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditContent('')
  }

  const handleDeleteMessage = () => {
    if (!messageToDelete) return

    const mutation = deleteForEveryone ? deleteMessageForEveryone : deleteMessageForMe

    mutation.mutate(messageToDelete, {
      onSuccess: () => {
        setShowDeleteMessageDialog(false)
        setMessageToDelete(null)
        setDeleteForEveryone(false)
        setShowMessageMenu(null)
      },
      onError: (error) => {
        console.error('Error deleting message:', error)
        setShowDeleteMessageDialog(false)
      }
    })
  }

  const handleMediaSelect = (file) => {
    if (!file) return

    // Create preview URL
    const url = URL.createObjectURL(file)
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    setMediaPreview({ file, url, type })
  }

  // Helper to format message preview in conversation list
  const formatMessagePreview = (content) => {
    if (!content) return ''

    // Detectar respuestas a historias - extraer solo el mensaje de respuesta
    if (content.startsWith('[STORY_REPLY:') || content.startsWith('[STORY_REPLY_TEXT')) {
      const restContent = content.replace(/^\[STORY_REPLY[^\]]*\]\n/, '')
      // Si empieza con comillas, el mensaje está después del doble salto de línea
      if (restContent.startsWith('"')) {
        const lines = restContent.split('\n\n')
        const replyMessage = lines.slice(1).join('\n\n')
        return replyMessage || 'Respondió a tu historia'
      }
      // Si no tiene comillas, todo es el mensaje de respuesta
      return restContent || 'Respondió a tu historia'
    }
    if (content.startsWith('📩') || content.includes('Respondió a tu historia')) {
      // Extraer solo la respuesta del formato antiguo
      const match = content.match(/["'](.+?)["']\s*(.*)$/s)
      if (match && match[2]) {
        return match[2].trim()
      }
      // Buscar mensaje después de salto de línea
      const lineMatch = content.match(/\n\n(.+)$/s)
      if (lineMatch && lineMatch[1]) {
        return lineMatch[1].trim()
      }
      return 'Respondió a tu historia'
    }

    const firstLine = content.split('\n')[0]

    // Check if it's a media URL
    if (firstLine.match(/\.(gif)/i) || firstLine.includes('giphy.com')) {
      return 'GIF'
    }
    if (firstLine.match(/\.(jpg|jpeg|png|webp)/i)) {
      return 'Foto'
    }
    if (firstLine.match(/\.(mp4|webm|mov)/i)) {
      return 'Video'
    }

    return firstLine
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <SEO
        title="Mensajes"
        description="Mensajes privados en Seven. Comunicate con otros cineastas de la comunidad."
        noIndex
      />

      <div className="flex h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Conversations List */}
        <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('messages.title')}</h2>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => (
                <div
                  key={conv.otherUser.id}
                  className={`relative w-full border-b border-gray-100 dark:border-gray-700 ${
                    selectedUser?.id === conv.otherUser.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <button
                      onClick={() => setSelectedUser(conv.otherUser)}
                      className="flex-1 p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Avatar */}
                      {conv.otherUser.avatar_url ? (
                        <img
                          src={conv.otherUser.avatar_url}
                          alt={conv.otherUser.full_name}
                          className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {conv.otherUser.full_name?.[0] || conv.otherUser.username?.[0] || 'U'}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left overflow-hidden">
                        <p className="font-semibold text-gray-900 dark:text-white truncate mb-0.5">
                          {conv.otherUser.full_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conv.sender_id === user?.id ? t('messages.you') + ' ' : ''}
                          {formatMessagePreview(conv.content)}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(conv.created_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </span>
                      </div>

                      {/* Unread indicator */}
                      {conv.isUnread && (
                        <div className="h-2 w-2 rounded-full bg-primary-600 flex-shrink-0"></div>
                      )}
                    </button>

                    {/* Menu button */}
                    <div className="relative flex items-center pr-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowConversationMenu(showConversationMenu === conv.otherUser.id ? null : conv.otherUser.id)
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </button>

                      {/* Menu dropdown */}
                      {showConversationMenu === conv.otherUser.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowConversationMenu(null)}
                          ></div>
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 border border-gray-200 dark:border-gray-700 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setConversationToDelete(conv.otherUser.id)
                                setShowDeleteDialog(true)
                                setShowConversationMenu(null)
                              }}
                              className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>{t('messages.deleteConversation')}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-4">
                <MessageCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">{t('messages.noConversations')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {t('messages.searchUsers')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.full_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                    {selectedUser.full_name?.[0] || selectedUser.username?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.full_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{selectedUser.username}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((message) => {
                    const isOwn = message.sender_id === user?.id
                    const isEditing = editingMessage === message.id
                    const content = message.content || ''
                    const firstLine = content.split('\n')[0]
                    const isMedia = firstLine.match(/\.(gif|jpg|jpeg|png|webp|mp4|webm|mov)/i) || firstLine.includes('giphy.com')
                    const hasCaption = content.split('\n').length > 1 && content.split('\n').slice(1).join('').trim()

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg ${
                            isMedia && !hasCaption
                              ? '' // Sin fondo para media sin caption
                              : isMedia
                                ? 'p-2 ' + (isOwn ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700')
                                : 'px-4 py-2 ' + (isOwn ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700')
                          }`}
                        >
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit()
                                    if (e.key === 'Escape') handleCancelEdit()
                                  }}
                                  className="w-full px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="text-xs px-2 py-1 bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                                  >
                                    {t('common.save')}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-xs px-2 py-1 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Check if content is a media URL */}
                                {(() => {
                                  const content = message.content || ''

                                  // Detectar respuesta a historia con media (nuevo formato con IDs)
                                  // Formato: [STORY_REPLY:storyId:storyOwnerId:media_url:media_type]
                                  const storyReplyNewMatch = content.match(/^\[STORY_REPLY:([a-f0-9-]+):([a-f0-9-]+):(.+):(image|video)\]\n/)
                                  if (storyReplyNewMatch) {
                                    const storyId = storyReplyNewMatch[1]
                                    const storyOwnerId = storyReplyNewMatch[2]
                                    const storyMediaUrl = storyReplyNewMatch[3]
                                    const storyMediaType = storyReplyNewMatch[4]
                                    const restContent = content.replace(/^\[STORY_REPLY:[^\]]+\]\n/, '')

                                    // Si empieza con comillas, tiene texto de historia
                                    let replyMessage = restContent

                                    if (restContent.startsWith('"')) {
                                      const lines = restContent.split('\n\n')
                                      replyMessage = lines.slice(1).join('\n\n')
                                    }

                                    return (
                                      <div className="space-y-2">
                                        <button
                                          onClick={() => setStoryToView({ storyId, storyOwnerId })}
                                          className={`block w-full rounded-lg overflow-hidden ${isOwn ? 'bg-primary-500/20' : 'bg-black/20'} hover:opacity-80 transition-opacity`}
                                        >
                                          <div className="relative w-full aspect-[4/3] max-h-32">
                                            {storyMediaType === 'video' ? (
                                              <>
                                                <video src={storyMediaUrl} className="w-full h-full object-cover" muted />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                  <Play className="w-8 h-8 text-white" fill="white" />
                                                </div>
                                              </>
                                            ) : (
                                              <img src={storyMediaUrl} alt="" className="w-full h-full object-cover" />
                                            )}
                                          </div>
                                          <div className={`px-2 py-1 text-xs ${isOwn ? 'text-primary-100' : 'text-gray-400'}`}>
                                            Respondió a tu historia
                                          </div>
                                        </button>
                                        {replyMessage && <p className="break-words mt-1">{replyMessage}</p>}
                                      </div>
                                    )
                                  }

                                  // Detectar respuesta a historia con media (formato antiguo sin IDs)
                                  // Formato: [STORY_REPLY:media_url:media_type]
                                  const storyReplyOldMatch = content.match(/^\[STORY_REPLY:(.+):(image|video)\]\n/)
                                  if (storyReplyOldMatch) {
                                    const storyMediaUrl = storyReplyOldMatch[1]
                                    const storyMediaType = storyReplyOldMatch[2]
                                    const restContent = content.replace(/^\[STORY_REPLY:[^\]]+\]\n/, '')

                                    // Si empieza con comillas, tiene texto de historia
                                    let replyMessage = restContent

                                    if (restContent.startsWith('"')) {
                                      const lines = restContent.split('\n\n')
                                      replyMessage = lines.slice(1).join('\n\n')
                                    }

                                    return (
                                      <div className="space-y-2">
                                        <button
                                          onClick={() => setMediaToView({ url: storyMediaUrl, type: storyMediaType })}
                                          className={`block w-full rounded-lg overflow-hidden ${isOwn ? 'bg-primary-500/20' : 'bg-black/20'} hover:opacity-80 transition-opacity`}
                                        >
                                          <div className="relative w-full aspect-[4/3] max-h-32">
                                            {storyMediaType === 'video' ? (
                                              <>
                                                <video src={storyMediaUrl} className="w-full h-full object-cover" muted />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                  <Play className="w-8 h-8 text-white" fill="white" />
                                                </div>
                                              </>
                                            ) : (
                                              <img src={storyMediaUrl} alt="" className="w-full h-full object-cover" />
                                            )}
                                          </div>
                                          <div className={`px-2 py-1 text-xs ${isOwn ? 'text-primary-100' : 'text-gray-400'}`}>
                                            Respondió a tu historia
                                          </div>
                                        </button>
                                        {replyMessage && <p className="break-words mt-1">{replyMessage}</p>}
                                      </div>
                                    )
                                  }

                                  // Detectar respuesta a historia de solo texto (formato nuevo con IDs)
                                  const storyTextReplyNewMatch = content.match(/^\[STORY_REPLY_TEXT:([a-f0-9-]+):([a-f0-9-]+)\]\n/)
                                  if (storyTextReplyNewMatch) {
                                    const storyId = storyTextReplyNewMatch[1]
                                    const storyOwnerId = storyTextReplyNewMatch[2]
                                    const restContent = content.replace(/^\[STORY_REPLY_TEXT:[^\]]+\]\n/, '')
                                    const lines = restContent.split('\n\n')
                                    const storyText = lines[0]?.replace(/^"|"$/g, '')
                                    const replyMessage = lines.slice(1).join('\n\n')

                                    return (
                                      <div className="space-y-1">
                                        <button
                                          onClick={() => setStoryToView({ storyId, storyOwnerId })}
                                          className={`text-xs px-2 py-1 rounded ${isOwn ? 'bg-primary-500/30 hover:bg-primary-500/40' : 'bg-black/30 hover:bg-black/40'} transition-colors text-left`}
                                        >
                                          <span className={isOwn ? 'text-primary-100' : 'text-gray-300'}>
                                            Historia: "{storyText?.slice(0, 30)}{storyText?.length > 30 ? '...' : ''}"
                                          </span>
                                        </button>
                                        {replyMessage && <p className="break-words">{replyMessage}</p>}
                                      </div>
                                    )
                                  }

                                  // Detectar respuesta a historia de solo texto (formato antiguo sin IDs)
                                  const storyTextReplyOldMatch = content.match(/^\[STORY_REPLY_TEXT\]\n/)
                                  if (storyTextReplyOldMatch) {
                                    const restContent = content.replace(/^\[STORY_REPLY_TEXT\]\n/, '')
                                    const lines = restContent.split('\n\n')
                                    const storyText = lines[0]?.replace(/^"|"$/g, '')
                                    const replyMessage = lines.slice(1).join('\n\n')

                                    return (
                                      <div className="space-y-1">
                                        <button
                                          onClick={() => setMediaToView({ text: storyText })}
                                          className={`text-xs px-2 py-1 rounded ${isOwn ? 'bg-primary-500/30 hover:bg-primary-500/40' : 'bg-black/30 hover:bg-black/40'} transition-colors text-left`}
                                        >
                                          <span className={isOwn ? 'text-primary-100' : 'text-gray-300'}>
                                            Historia: "{storyText?.slice(0, 30)}{storyText?.length > 30 ? '...' : ''}"
                                          </span>
                                        </button>
                                        {replyMessage && <p className="break-words">{replyMessage}</p>}
                                      </div>
                                    )
                                  }

                                  // Detectar formato antiguo: "📩 Respondió a tu historia..." o similar
                                  const oldFormatMatch = content.match(/^📩\s*Respondió a tu historia[:\s]*["']?(.+?)["']?\s*\n\n(.+)$/s)
                                  if (oldFormatMatch) {
                                    const storyText = oldFormatMatch[1]?.trim()
                                    const replyMessage = oldFormatMatch[2]?.trim()

                                    return (
                                      <div className="space-y-1">
                                        <button
                                          onClick={() => setMediaToView({ text: storyText })}
                                          className={`text-xs px-2 py-1 rounded ${isOwn ? 'bg-primary-500/30 hover:bg-primary-500/40' : 'bg-black/30 hover:bg-black/40'} transition-colors text-left`}
                                        >
                                          <span className={isOwn ? 'text-primary-100' : 'text-gray-300'}>
                                            Historia: "{storyText?.slice(0, 30)}{storyText?.length > 30 ? '...' : ''}"
                                          </span>
                                        </button>
                                        {replyMessage && <p className="break-words">{replyMessage}</p>}
                                      </div>
                                    )
                                  }

                                  // Detectar formato más simple: línea con emoji 📩 seguida de texto
                                  const simpleStoryReply = content.match(/^📩\s*Respondió a tu historia[:\s]*(.+)$/s)
                                  if (simpleStoryReply) {
                                    const fullText = simpleStoryReply[1]
                                    // Intentar separar el texto de la historia del mensaje
                                    const quotedMatch = fullText.match(/["'](.+?)["']\s*(.*)$/s)
                                    if (quotedMatch) {
                                      const storyText = quotedMatch[1]
                                      const replyMessage = quotedMatch[2]?.trim()

                                      return (
                                        <div className="space-y-1">
                                          <button
                                            onClick={() => setMediaToView({ text: storyText })}
                                            className={`text-xs px-2 py-1 rounded ${isOwn ? 'bg-primary-500/30 hover:bg-primary-500/40' : 'bg-black/30 hover:bg-black/40'} transition-colors text-left`}
                                          >
                                            <span className={isOwn ? 'text-primary-100' : 'text-gray-300'}>
                                              Historia: "{storyText?.slice(0, 30)}{storyText?.length > 30 ? '...' : ''}"
                                            </span>
                                          </button>
                                          {replyMessage && <p className="break-words">{replyMessage}</p>}
                                        </div>
                                      )
                                    }
                                    // Si no tiene comillas, mostrar todo como respuesta simple
                                    return (
                                      <p className="break-words">{fullText}</p>
                                    )
                                  }

                                  const lines = content.split('\n')
                                  const mediaUrl = lines[0]
                                  const caption = lines.slice(1).join('\n').trim()

                                  const isGif = mediaUrl.match(/\.(gif)/i) || mediaUrl.includes('giphy.com')
                                  const isImage = mediaUrl.match(/\.(jpg|jpeg|png|webp)/i) || (mediaUrl.includes('supabase') && mediaUrl.match(/\.(jpg|jpeg|png|webp)/i))
                                  const isVideo = mediaUrl.match(/\.(mp4|webm|mov)/i)

                                  if (isGif) {
                                    return (
                                      <>
                                        <img
                                          src={mediaUrl}
                                          alt="GIF"
                                          className="max-w-full w-auto h-auto rounded"
                                          style={{ maxWidth: '200px', maxHeight: '150px' }}
                                          loading="lazy"
                                        />
                                        {caption && <p className="break-words mt-2">{caption}</p>}
                                      </>
                                    )
                                  } else if (isImage) {
                                    return (
                                      <>
                                        <img
                                          src={mediaUrl}
                                          alt="Imagen"
                                          className="max-w-full w-auto h-auto rounded cursor-pointer hover:opacity-90"
                                          style={{ maxWidth: '200px', maxHeight: '200px' }}
                                          loading="lazy"
                                          onClick={() => window.open(mediaUrl, '_blank')}
                                        />
                                        {caption && <p className="break-words mt-2">{caption}</p>}
                                      </>
                                    )
                                  } else if (isVideo) {
                                    return (
                                      <>
                                        <video
                                          src={mediaUrl}
                                          controls
                                          className="max-w-full w-auto h-auto rounded"
                                          style={{ maxWidth: '200px', maxHeight: '200px' }}
                                          preload="metadata"
                                        />
                                        {caption && <p className="break-words mt-2">{caption}</p>}
                                      </>
                                    )
                                  } else {
                                    return <p className="break-words">{content}</p>
                                  }
                                })()}
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwn ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {formatDistanceToNow(new Date(message.created_at), {
                                    addSuffix: true,
                                    locale: dateLocale,
                                  })}
                                  {message.edited_at && ` (${t('messages.edited')})`}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Message menu */}
                          {!isEditing && (
                            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowMessageMenu(showMessageMenu === message.id ? null : message.id)
                                }}
                                className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                  isOwn ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {showMessageMenu === message.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMessageMenu(null)}
                                  ></div>
                                  <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 border border-gray-200 dark:border-gray-700 z-20`}>
                                    {isOwn && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditMessage(message)
                                        }}
                                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                      >
                                        <Edit className="h-4 w-4" />
                                        <span>{t('messages.edit')}</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setMessageToDelete(message.id)
                                        setDeleteForEveryone(false)
                                        setShowDeleteMessageDialog(true)
                                        setShowMessageMenu(null)
                                      }}
                                      className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                    >
                                      <Trash className="h-4 w-4" />
                                      <span>{t('messages.deleteForMe')}</span>
                                    </button>
                                    {isOwn && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setMessageToDelete(message.id)
                                          setDeleteForEveryone(true)
                                          setShowDeleteMessageDialog(true)
                                          setShowMessageMenu(null)
                                        }}
                                        className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span>{t('messages.deleteForEveryone')}</span>
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('messages.sendMessage')}
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {/* Media Preview */}
                {mediaPreview && (
                  <div className="mb-3 relative inline-block">
                    <button
                      type="button"
                      onClick={clearMediaPreview}
                      className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {mediaPreview.type === 'video' ? (
                      <video
                        src={mediaPreview.url}
                        className="max-h-32 rounded-lg border border-gray-300 dark:border-gray-600"
                        controls
                      />
                    ) : (
                      <img
                        src={mediaPreview.url}
                        alt="Preview"
                        className="max-h-32 rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                    )}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  {uploadingMedia && (
                    <div className="flex items-center text-primary-600">
                      <Loader2 className="w-5 h-5 animate-spin mr-1" />
                    </div>
                  )}
                  <EmojiGifPicker
                    onSelect={(emoji) => setMessageContent(prev => prev + emoji)}
                    onMediaSelect={handleMediaSelect}
                    position="top"
                  />
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder={t('messages.placeholder')}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={sendMessage.isPending}
                  />
                  <button
                    type="submit"
                    disabled={(!messageContent.trim() && !mediaPreview) || sendMessage.isPending || uploadingMedia}
                    className="btn btn-primary rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendMessage.isPending || uploadingMedia ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('messages.yourMessages')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('messages.selectConversation')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {storyToView && storyData && (
        <StoryViewer
          storiesData={storyData}
          initialUserIndex={0}
          onClose={() => setStoryToView(null)}
        />
      )}

      {/* Story Viewer para historias antiguas (buscadas por URL) */}
      {mediaToView && storyDataByUrl && (
        <StoryViewer
          storiesData={storyDataByUrl}
          initialUserIndex={0}
          onClose={() => setMediaToView(null)}
        />
      )}

      {/* Media Viewer Modal (fallback si no se encuentra la historia) */}
      {mediaToView && !storyDataByUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setMediaToView(null)}
        >
          <button
            onClick={() => setMediaToView(null)}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {mediaToView.url ? (
              mediaToView.type === 'video' ? (
                <video
                  src={mediaToView.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[90vh] rounded-lg"
                />
              ) : (
                <img
                  src={mediaToView.url}
                  alt="Historia"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
              )
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-400 text-lg mb-2">Historia no disponible</p>
                <p className="text-gray-500 text-sm">La historia puede haber expirado o sido eliminada</p>
                {mediaToView.text && (
                  <p className="text-white mt-4 text-xl">"{mediaToView.text}"</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Conversation Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConversation}
        title={t('messages.deleteConversation')}
        message={t('messages.deleteConversationConfirm')}
        confirmText={t('common.delete')}
        type="danger"
      />

      {/* Delete Message Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteMessageDialog}
        onClose={() => {
          setShowDeleteMessageDialog(false)
          setMessageToDelete(null)
          setDeleteForEveryone(false)
        }}
        onConfirm={handleDeleteMessage}
        title={deleteForEveryone ? t('messages.deleteForEveryone') : t('messages.deleteForMe')}
        message={deleteForEveryone ? t('messages.deleteMessageForEveryoneConfirm') : t('messages.deleteMessageForMeConfirm')}
        confirmText={t('common.delete')}
        type="danger"
      />
    </div>
  )
}

export default Messages
