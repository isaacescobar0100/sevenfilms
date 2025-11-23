// Iconos SVG personalizados para las reacciones de posts

export const ReactionIcons = {
  // Obra Maestra - Trofeo dorado con estrella
  masterpiece: ({ className = "w-5 h-5" }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14.3l-4.8 2.3.9-5.3-3.8-3.7 5.3-.8L12 2z" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
      <path d="M8 17v4l4-2 4 2v-4" fill="#FFD700" stroke="#B8860B" strokeWidth="1"/>
      <circle cx="12" cy="9" r="2" fill="#FFF5CC"/>
    </svg>
  ),

  // Excelente - Estrella brillante
  excellent: ({ className = "w-5 h-5" }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2l3 6.5 7 1-5 4.9 1.2 7L12 18l-6.2 3.4L7 14.4l-5-4.9 7-1L12 2z" fill="#FFA500" stroke="#CC7000" strokeWidth="1"/>
      <path d="M12 6l1.5 3.2 3.5.5-2.5 2.4.6 3.5L12 14l-3.1 1.6.6-3.5-2.5-2.4 3.5-.5L12 6z" fill="#FFE4B5"/>
    </svg>
  ),

  // Entretenido - Palomitas de cine
  popcorn: ({ className = "w-5 h-5" }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 10h12l-1.5 11H7.5L6 10z" fill="#DC2626" stroke="#991B1B" strokeWidth="1"/>
      <path d="M6 10c0-2 .5-3 1.5-3s1.5 1 1.5 1 .5-2 2-2 2 1.5 2 1.5.5-1.5 2-1.5 2 2 2 2 .5-1 1.5-1 1.5 1 1.5 3" fill="#FEF3C7" stroke="#D97706" strokeWidth="1"/>
      <ellipse cx="8" cy="8" rx="1.5" ry="2" fill="#FEF3C7"/>
      <ellipse cx="12" cy="7" rx="1.5" ry="2" fill="#FEF3C7"/>
      <ellipse cx="16" cy="8" rx="1.5" ry="2" fill="#FEF3C7"/>
      <path d="M8 12h2M11 14h2M14 12h2" stroke="#FFF" strokeWidth="0.5" strokeLinecap="round"/>
    </svg>
  ),

  // Meh - Pulgar abajo estilizado
  meh: ({ className = "w-5 h-5" }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 13v5c0 1.1.9 2 2 2h6c.8 0 1.5-.5 1.8-1.2l2-5c.4-1-.4-2-1.5-2H13l.7-3.5c.1-.6-.1-1.3-.6-1.7-.5-.4-1.2-.5-1.8-.2L7 9" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1.5"/>
      <path d="M4 13h2v7H4c-.6 0-1-.4-1-1v-5c0-.6.4-1 1-1z" fill="#6B7280"/>
    </svg>
  ),

  // Aburrido - Zzz con luna
  boring: ({ className = "w-5 h-5" }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" fill="#1E3A5F" stroke="#0F172A" strokeWidth="1"/>
      <path d="M13 8h4l-4 3h4" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12h3l-3 2.5h3" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 15h2l-2 1.5h2" stroke="#BFDBFE" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="9" r="0.5" fill="#FFF"/>
      <circle cx="5" cy="13" r="0.3" fill="#FFF"/>
    </svg>
  ),
}

export default ReactionIcons
