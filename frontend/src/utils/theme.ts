export type Theme = 'light' | 'dark';

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null;
  // Default to dark mode for neon indigo ops system
  return stored || 'dark';
}

export function applyTheme(newTheme: Theme): void {
  const html = document.documentElement;
  if (newTheme === 'dark') {
    html.classList.add('dark');
    html.classList.remove('light');
  } else {
    html.classList.remove('dark');
    html.classList.add('light');
  }
  localStorage.setItem('theme', newTheme);
}
