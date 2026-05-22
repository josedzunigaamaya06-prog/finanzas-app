import { create } from 'zustand';

const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),

  toggle: () => set((state) => {
    const next = !state.isDark;
    localStorage.setItem('theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDark: next };
  }),

  init: () => {
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
    set({ isDark });
  },
}));

export default useThemeStore;
