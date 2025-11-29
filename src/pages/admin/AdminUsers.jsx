import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, MoreVertical, Trash2, Users, BadgeCheck, BadgeX, Shield, ShieldOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ConfirmDialog from '../../components/common/ConfirmDialog'

function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [userToChangeRole, setUserToChangeRole] = useState(null)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [userToVerify, setUserToVerify] = useState(null)
  const queryClient = useQueryClient()

  // Fetch users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query.limit(50)
      if (error) throw error
      return data
    },
    staleTime: 30 * 1000,
  })

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowMenu(null)
      setRoleDialogOpen(false)
      setUserToChangeRole(null)
    },
  })

  // Update user verification mutation
  const updateVerificationMutation = useMutation({
    mutationFn: async ({ userId, verified }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ verified })
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowMenu(null)
      setVerifyDialogOpen(false)
      setUserToVerify(null)
    },
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      // Delete related data first
      await supabase.from('posts').delete().eq('user_id', userId)
      await supabase.from('comments').delete().eq('user_id', userId)
      await supabase.from('likes').delete().eq('user_id', userId)
      await supabase.from('follows').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`)

      // Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    },
  })

  const handleToggleRole = (user) => {
    setUserToChangeRole(user)
    setRoleDialogOpen(true)
    setShowMenu(null)
  }

  const confirmToggleRole = () => {
    if (userToChangeRole) {
      const newRole = userToChangeRole.role === 'admin' ? 'user' : 'admin'
      updateRoleMutation.mutate({ userId: userToChangeRole.id, newRole })
    }
  }

  const handleToggleVerification = (user) => {
    setUserToVerify(user)
    setVerifyDialogOpen(true)
    setShowMenu(null)
  }

  const confirmToggleVerification = () => {
    if (userToVerify) {
      updateVerificationMutation.mutate({
        userId: userToVerify.id,
        verified: !userToVerify.verified
      })
    }
  }

  const handleDeleteUser = (user) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
    setShowMenu(null)
  }

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestiona los usuarios de la plataforma</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error al cargar usuarios: {error.message}
          </div>
        ) : users?.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500">
                              <Users className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                            {user.full_name || 'Sin nombre'}
                            {user.verified && (
                              <BadgeCheck className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.verified
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.verified ? (
                          <>
                            <BadgeCheck className="h-3 w-3 mr-1" />
                            Verificado
                          </>
                        ) : (
                          'Sin verificar'
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === user.id ? null : user.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {showMenu === user.id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              {/* Hacer Admin / Quitar Admin */}
                              <button
                                onClick={() => handleToggleRole(user)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {user.role === 'admin' ? (
                                  <>
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Quitar Admin
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Hacer Admin
                                  </>
                                )}
                              </button>

                              {/* Verificar / Quitar Verificación */}
                              <button
                                onClick={() => handleToggleVerification(user)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {user.verified ? (
                                  <>
                                    <BadgeX className="h-4 w-4 mr-2" />
                                    Quitar Verificación
                                  </>
                                ) : (
                                  <>
                                    <BadgeCheck className="h-4 w-4 mr-2" />
                                    Verificar
                                  </>
                                )}
                              </button>

                              {/* Eliminar Usuario */}
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar Usuario
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Close menu on outside click */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(null)}
        />
      )}

      {/* Role Change Dialog */}
      <ConfirmDialog
        isOpen={roleDialogOpen}
        onClose={() => {
          setRoleDialogOpen(false)
          setUserToChangeRole(null)
        }}
        onConfirm={confirmToggleRole}
        title={userToChangeRole?.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
        message={userToChangeRole?.role === 'admin'
          ? `¿Estás seguro de quitar los permisos de administrador a ${userToChangeRole?.username}?`
          : `¿Estás seguro de hacer administrador a ${userToChangeRole?.username}?`
        }
        confirmText={updateRoleMutation.isPending ? 'Procesando...' : 'Confirmar'}
        cancelText="Cancelar"
        type="warning"
      />

      {/* Verification Dialog */}
      <ConfirmDialog
        isOpen={verifyDialogOpen}
        onClose={() => {
          setVerifyDialogOpen(false)
          setUserToVerify(null)
        }}
        onConfirm={confirmToggleVerification}
        title={userToVerify?.verified ? 'Quitar Verificación' : 'Verificar Usuario'}
        message={userToVerify?.verified
          ? `¿Estás seguro de quitar la verificación a ${userToVerify?.username}?`
          : `¿Estás seguro de verificar a ${userToVerify?.username}? Aparecerá una insignia azul junto a su nombre.`
        }
        confirmText={updateVerificationMutation.isPending ? 'Procesando...' : 'Confirmar'}
        cancelText="Cancelar"
        type="info"
      />

      {/* Delete User Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setUserToDelete(null)
        }}
        onConfirm={confirmDeleteUser}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a ${userToDelete?.username}? Esta acción eliminará todos sus posts, comentarios y datos asociados. Esta acción no se puede deshacer.`}
        confirmText={deleteUserMutation.isPending ? 'Eliminando...' : 'Eliminar'}
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}

export default AdminUsers
