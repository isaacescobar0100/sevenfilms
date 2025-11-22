import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, ArrowLeft, Trash2, MoreVertical, Edit, Trash } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useConversations, useMessages, useSendMessage, useMarkAsRead, useRealtimeMessages, useDeleteConversation, useEditMessage, useDeleteMessageForMe, useDeleteMessageForEveryone } from '../hooks/useMessages'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmojiGifPicker from '../components/common/EmojiGifPicker'
import { formatDistanceToNow } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

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

  const dateLocale = i18n.language === 'es' ? es : enUS

  const { data: conversations, isLoading: conversationsLoading } = useConversations()
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedUser?.id)
  const sendMessage = useSendMessage()
  const markAsRead = useMarkAsRead()
  const deleteConversation = useDeleteConversation()
  const editMessage = useEditMessage()
  const deleteMessageForMe = useDeleteMessageForMe()
  const deleteMessageForEveryone = useDeleteMessageForEveryone()

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
    if (!messageContent.trim() || !selectedUser) return

    try {
      await sendMessage.mutateAsync({
        receiverId: selectedUser.id,
        content: messageContent.trim(),
      })
      setMessageContent('')
    } catch (error) {
      console.error('Error sending message:', error)
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

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
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
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {conv.otherUser.full_name}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(conv.created_at), {
                              addSuffix: true,
                              locale: dateLocale,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conv.sender_id === user?.id ? t('messages.you') + ' ' : ''}
                          {conv.content}
                        </p>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((message) => {
                    const isOwn = message.sender_id === user?.id
                    const isEditing = editingMessage === message.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div className={`flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwn
                                ? 'bg-primary-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
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
                                {/* Check if content is a GIF/image URL */}
                                {message.content?.match(/\.(gif|giphy\.com)/i) ? (
                                  <img
                                    src={message.content}
                                    alt="GIF"
                                    className="max-w-[200px] max-h-[150px] rounded"
                                    loading="lazy"
                                  />
                                ) : (
                                  <p className="break-words">{message.content}</p>
                                )}
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
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <EmojiGifPicker
                    onSelect={(emoji) => setMessageContent(prev => prev + emoji)}
                    onGifSelect={(gifUrl) => {
                      sendMessage.mutate({
                        receiverId: selectedUser.id,
                        content: gifUrl,
                      })
                    }}
                    onStickerSelect={(stickerUrl) => {
                      sendMessage.mutate({
                        receiverId: selectedUser.id,
                        content: stickerUrl,
                      })
                    }}
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
                    disabled={!messageContent.trim() || sendMessage.isPending}
                    className="btn btn-primary rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendMessage.isPending ? (
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
