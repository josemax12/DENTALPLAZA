import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
    isDark: boolean;
    toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            isDark: false,
            toggle: () =>
                set((state) => {
                    const next = !state.isDark;
                    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
                    return { isDark: next };
                }),
        }),
        {
            name: 'dental-theme',
            onRehydrateStorage: () => (state) => {
                if (state?.isDark) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                }
            },
        }
    )
);
