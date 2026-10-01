import { create } from 'zustand'
import type { UsuarioType } from '../utils/tipos'

type UsuarioStore = {
  usuario: UsuarioType | null
  logaUsuario: (usuario: UsuarioType) => void
  deslogaUsuario: () => void
}

export const useUsuarioStore = create<UsuarioStore>((set) => ({
  usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
  logaUsuario: (usuario) => {
    localStorage.setItem('usuario', JSON.stringify(usuario))
    set({ usuario })
  },
  deslogaUsuario: () => {
    localStorage.removeItem('usuario')
    set({ usuario: null })
  },
}))
