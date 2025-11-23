import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStories } from '../../hooks/useStories'
import { useAuthStore } from '../../store/authStore'
import { useProfile } from '../../hooks/useProfiles'
import StoryViewer from './StoryViewer'

function StoriesBar() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { data: profile } = useProfile(user?.id)
  const { data: storiesData = [], isLoading } = useStories()
  const [selectedUserIndex, setSelectedUserIndex] = useState(null)

  // Usar avatar del perfil (tabla profiles) que es el mismo que se muestra en otros lugares
  const avatarUrl = profile?.avatar_url
  const username = profile?.username || user?.user_metadata?.username

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Encontrar si tengo historias
  const myStories = storiesData.find(s => s.isOwn)
  const otherStories = storiesData.filter(s => !s.isOwn)

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Mi historia / Agregar historia */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {myStories ? (
              <button
                onClick={() => setSelectedUserIndex(storiesData.findIndex(s => s.isOwn))}
                className="relative"
              >
                <div className={`w-16 h-16 rounded-full p-0.5 ${
                  myStories.hasUnviewed
                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold">
                        {username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                </div>
                {/* Botón de agregar */}
                <Link
                  to="/stories/create"
                  className="absolute -bottom-1 -right-1 bg-primary-600 rounded-full p-1 border-2 border-white dark:border-gray-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="h-3 w-3 text-white" />
                </Link>
              </button>
            ) : (
              <Link to="/stories/create" className="relative">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="w-full h-full rounded-full object-cover opacity-50"
                    />
                  ) : (
                    <Plus className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary-600 rounded-full p-1 border-2 border-white dark:border-gray-800">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </Link>
            )}
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-16 text-center">
              {t('stories.yourStory', 'Tu historia')}
            </span>
          </div>

          {/* Historias de otros */}
          {otherStories.map((userStories, index) => (
            <button
              key={userStories.user_id}
              onClick={() => setSelectedUserIndex(storiesData.findIndex(s => s.user_id === userStories.user_id))}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className={`w-16 h-16 rounded-full p-0.5 ${
                userStories.hasUnviewed
                  ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5">
                  {userStories.avatar_url ? (
                    <img
                      src={userStories.avatar_url}
                      alt={userStories.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold">
                      {userStories.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-16 text-center">
                {userStories.username}
              </span>
            </button>
          ))}

          {/* Mensaje si no hay historias */}
          {storiesData.length === 0 && (
            <div className="flex items-center justify-center flex-1 py-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('stories.noStories', 'No hay historias todavía')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Visor de historias */}
      {selectedUserIndex !== null && (
        <StoryViewer
          storiesData={storiesData}
          initialUserIndex={selectedUserIndex}
          onClose={() => setSelectedUserIndex(null)}
        />
      )}
    </>
  )
}

export default StoriesBar
