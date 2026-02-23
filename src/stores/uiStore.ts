import { create } from 'zustand'

export type ViewName =
  | 'welcome'
  | 'auth'
  | 'onboarding'
  | 'chat'
  | 'history'
  | 'settings'
  | 'account'
  | 'legal'

interface UiState {
  isOpen: boolean
  currentView: ViewName
  legalType: 'terms' | 'privacy' | null
  onboardingStep: number
  navigationStack: ViewName[]

  open: () => void
  close: () => void
  toggle: () => void
  navigateTo: (view: ViewName, legalType?: 'terms' | 'privacy') => void
  goBack: () => void
  setOnboardingStep: (step: number) => void
  reset: () => void
}

export const useUiStore = create<UiState>((set, get) => ({
  isOpen: false,
  currentView: 'welcome',
  legalType: null,
  onboardingStep: 0,
  navigationStack: [],

  open: () => set({ isOpen: true }),
  close: () =>
    set({
      isOpen: false,
      currentView: 'welcome',
      navigationStack: [],
      legalType: null,
    }),
  toggle: () => {
    const { isOpen } = get()
    if (isOpen) {
      get().close()
    } else {
      set({ isOpen: true })
    }
  },

  navigateTo: (view, legalType) =>
    set((state) => ({
      navigationStack: [...state.navigationStack, state.currentView],
      currentView: view,
      legalType: legalType ?? (view === 'legal' ? state.legalType : null),
    })),

  goBack: () =>
    set((state) => {
      const stack = [...state.navigationStack]
      const previous = stack.pop() || 'welcome'
      return {
        navigationStack: stack,
        currentView: previous,
        legalType: previous === 'legal' ? state.legalType : null,
      }
    }),

  setOnboardingStep: (step) => set({ onboardingStep: step }),

  reset: () =>
    set({
      currentView: 'welcome',
      legalType: null,
      onboardingStep: 0,
      navigationStack: [],
    }),
}))
