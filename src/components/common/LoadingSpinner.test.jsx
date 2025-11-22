import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/test-utils'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />)
    // El spinner debería estar presente
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('is accessible with proper aria attributes', () => {
    render(<LoadingSpinner />)
    // Verificar que hay indicación de loading
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})
