import { create } from 'zustand'

/**
 * useUIStore — global UI state.
 * Manages toasts, sidebar, modals, and loading overlays.
 */
const useUIStore = create((set, get) => ({
  // ── Sidebar ────────────────────────────────────────────────
  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // ── Toasts ─────────────────────────────────────────────────
  toasts: [],

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration — ms before auto-dismiss (default 4000)
   */
  showToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now()
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().dismissToast(id), duration)
    return id
  },

  dismissToast: (id) =>
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // ── Convenience wrappers ───────────────────────────────────
  success: (msg, duration) => get().showToast(msg, 'success', duration),
  error:   (msg, duration) => get().showToast(msg, 'error',   duration),
  warning: (msg, duration) => get().showToast(msg, 'warning', duration),
  info:    (msg, duration) => get().showToast(msg, 'info',    duration),

  // ── Modal ──────────────────────────────────────────────────
  modal: null,  // { title, content, onConfirm, onCancel }

  openModal:  (modal)  => set({ modal }),
  closeModal: ()       => set({ modal: null }),

  // ── Global loading overlay ─────────────────────────────────
  globalLoading: false,
  setGlobalLoading: (v) => set({ globalLoading: v }),
}))

export default useUIStore
