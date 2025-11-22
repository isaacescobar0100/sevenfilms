import { useState, useRef, useEffect } from 'react'
import { Smile, X, Search, Image } from 'lucide-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { GiphyFetch } from '@giphy/js-fetch-api'
import { useTranslation } from 'react-i18next'

// GIPHY API Key (free tier - public)
const gf = new GiphyFetch('GlVGYHkr3WSBnllca54iNt0yFbjz7L65')

// Stickers predefinidos
const STICKERS = [
  { id: 1, url: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif', name: 'thumbs up' },
  { id: 2, url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', name: 'clapping' },
  { id: 3, url: 'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif', name: 'love' },
  { id: 4, url: 'https://media.giphy.com/media/l41lGvinEgARjB2HC/giphy.gif', name: 'fire' },
  { id: 5, url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', name: 'wow' },
  { id: 6, url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif', name: 'laughing' },
  { id: 7, url: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', name: 'crying' },
  { id: 8, url: 'https://media.giphy.com/media/3oKIPf3C7HqqYBVcCk/giphy.gif', name: 'popcorn' },
  { id: 9, url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', name: 'movie' },
  { id: 10, url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', name: 'camera' },
  { id: 11, url: 'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif', name: 'star' },
  { id: 12, url: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif', name: 'party' },
]

function EmojiGifPicker({ onSelect, onGifSelect, onStickerSelect, onMediaSelect, position = 'top' }) {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('emoji') // 'emoji', 'gif', 'sticker'
  const [gifs, setGifs] = useState([])
  const [gifSearch, setGifSearch] = useState('')
  const [loadingGifs, setLoadingGifs] = useState(false)
  const pickerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load trending GIFs
  useEffect(() => {
    if (activeTab === 'gif' && gifs.length === 0) {
      loadTrendingGifs()
    }
  }, [activeTab])

  const loadTrendingGifs = async () => {
    setLoadingGifs(true)
    try {
      const { data } = await gf.trending({ limit: 20 })
      setGifs(data)
    } catch (error) {
      console.error('Error loading GIFs:', error)
    } finally {
      setLoadingGifs(false)
    }
  }

  const searchGifs = async (query) => {
    if (!query.trim()) {
      loadTrendingGifs()
      return
    }
    setLoadingGifs(true)
    try {
      const { data } = await gf.search(query, { limit: 20 })
      setGifs(data)
    } catch (error) {
      console.error('Error searching GIFs:', error)
    } finally {
      setLoadingGifs(false)
    }
  }

  const handleEmojiSelect = (emoji) => {
    onSelect?.(emoji.native)
    setIsOpen(false)
  }

  const handleGifSelect = (gif) => {
    onGifSelect?.(gif.images.fixed_height.url)
    setIsOpen(false)
    setGifSearch('')
  }

  const handleStickerSelect = (sticker) => {
    onStickerSelect?.(sticker.url)
    setIsOpen(false)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    searchGifs(gifSearch)
  }

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && onMediaSelect) {
      onMediaSelect(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const positionClasses = position === 'top'
    ? 'bottom-full mb-2'
    : 'top-full mt-2'

  return (
    <div className="relative" ref={pickerRef}>
      {/* Trigger buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen)
            setActiveTab('emoji')
          }}
          className="p-2 text-gray-500 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>
        {(onGifSelect || onStickerSelect) && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen)
              setActiveTab('gif')
            }}
            className="p-2 text-gray-500 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="GIFs & Stickers"
          >
            {/* GIF icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <text x="12" y="15" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">GIF</text>
            </svg>
          </button>
        )}
        {onMediaSelect && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Foto o Video"
            >
              <Image className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Picker panel */}
      {isOpen && (
        <div
          className={`absolute ${positionClasses} left-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden`}
          style={{ width: '320px' }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab('emoji')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'emoji'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Emojis
            </button>
            {onGifSelect && (
              <button
                type="button"
                onClick={() => setActiveTab('gif')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'gif'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                GIFs
              </button>
            )}
            {onStickerSelect && (
              <button
                type="button"
                onClick={() => setActiveTab('sticker')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'sticker'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Stickers
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-hidden">
            {/* Emoji Tab */}
            {activeTab === 'emoji' && (
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                locale={i18n.language === 'es' ? 'es' : 'en'}
                previewPosition="none"
                skinTonePosition="none"
                perLine={8}
                emojiSize={24}
                emojiButtonSize={32}
                maxFrequentRows={2}
              />
            )}

            {/* GIF Tab */}
            {activeTab === 'gif' && (
              <div className="p-2">
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="mb-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={gifSearch}
                      onChange={(e) => setGifSearch(e.target.value)}
                      placeholder="Buscar GIFs..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </form>

                {/* GIF Grid */}
                <div className="h-56 overflow-y-auto">
                  {loadingGifs ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {gifs.map((gif) => (
                        <button
                          key={gif.id}
                          type="button"
                          onClick={() => handleGifSelect(gif)}
                          className="relative aspect-video overflow-hidden rounded hover:ring-2 hover:ring-primary-500 transition-all"
                        >
                          <img
                            src={gif.images.fixed_height_small.url}
                            alt={gif.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* GIPHY Attribution */}
                <div className="mt-2 text-center">
                  <img
                    src="https://giphy.com/static/img/giphy-logo-square-social.png"
                    alt="Powered by GIPHY"
                    className="h-4 inline-block opacity-60"
                  />
                </div>
              </div>
            )}

            {/* Sticker Tab */}
            {activeTab === 'sticker' && (
              <div className="p-3 h-72 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                  {STICKERS.map((sticker) => (
                    <button
                      key={sticker.id}
                      type="button"
                      onClick={() => handleStickerSelect(sticker)}
                      className="aspect-square overflow-hidden rounded-lg hover:ring-2 hover:ring-primary-500 transition-all bg-gray-100 dark:bg-gray-700"
                    >
                      <img
                        src={sticker.url}
                        alt={sticker.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EmojiGifPicker
