import { create } from 'zustand'

function getInitialAuth() {
  try {
    return localStorage.getItem('cni_auth') === 'true'
  } catch {
    return false
  }
}

function getInitialOfficer() {
  try {
    const raw = localStorage.getItem('cni_officer')
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return {
    id: 'IND-LE-84029',
    name: 'Inspector Vikram Rathore',
    badge: 'NCRB-INV-7041',
    role: 'Lead Investigator',
    unit: 'Anti-Gang Intelligence Unit'
  }
}

const useAuthStore = create((set) => ({
  isAuthenticated: getInitialAuth(),
  officer: getInitialOfficer(),

  login: (officerData) => {
    try {
      localStorage.setItem('cni_auth', 'true')
      localStorage.setItem('cni_officer', JSON.stringify(officerData))
    } catch {
      // ignore
    }
    set({ isAuthenticated: true, officer: officerData })
  },

  logout: () => {
    try {
      localStorage.removeItem('cni_auth')
      localStorage.removeItem('cni_officer')
    } catch {
      // ignore
    }
    set({ isAuthenticated: false, officer: null })
  },
}))

export default useAuthStore
