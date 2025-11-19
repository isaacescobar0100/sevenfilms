import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useUpdateMovie } from '../../hooks/useMovies'
import LoadingSpinner from '../common/LoadingSpinner'
import { GENRES } from '../../utils/constants'
import { getTranslatedGenre } from '../../utils/genreMapper'

function EditMovieModal({ movie, onClose }) {
  const { t } = useTranslation()
  const updateMovie = useUpdateMovie()
  const [formData, setFormData] = useState({
    title: movie.title || '',
    description: movie.description || '',
    genre: movie.genre || '',
    year: movie.year || new Date().getFullYear(),
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.title || formData.title.trim().length < 3) {
      newErrors.title = t('movies.uploadModal.titleError')
    }

    if (!formData.genre) {
      newErrors.genre = t('movies.uploadModal.genreError')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await updateMovie.mutateAsync({
        id: movie.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        genre: formData.genre,
        year: parseInt(formData.year),
      })
      onClose()
    } catch (error) {
      console.error('Error updating movie:', error)
      setErrors({ submit: 'Error al actualizar la película. Inténtalo de nuevo.' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">{t('common.edit')} {t('movies.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('movies.uploadModal.titleField')}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('movies.uploadModal.titlePlaceholder')}
              className={`input ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('movies.uploadModal.description')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('movies.uploadModal.descriptionPlaceholder')}
              rows={4}
              className="input"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('movies.uploadModal.genreLabel')}
            </label>
            <select
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              className={`input ${errors.genre ? 'border-red-500' : ''}`}
            >
              <option value="">{t('movies.uploadModal.genreSelect')}</option>
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {getTranslatedGenre(genre, t)}
                </option>
              ))}
            </select>
            {errors.genre && (
              <p className="mt-1 text-sm text-red-600">{errors.genre}</p>
            )}
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('movies.uploadModal.year')}
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear()}
              className="input"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
              disabled={updateMovie.isPending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
              disabled={updateMovie.isPending}
            >
              {updateMovie.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                t('common.save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditMovieModal
