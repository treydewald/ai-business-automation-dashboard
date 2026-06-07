export type Theme = 'light' | 'dark';

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null;
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
  return stored || preferred;
}

export function applyTheme(newTheme: Theme): void {
  const html = document.documentElement;
  if (newTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  localStorage.setItem('theme', newTheme);
}
