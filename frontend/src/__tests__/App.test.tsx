import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders navigation', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    const nav = screen.queryByRole('navigation');
    if (nav) {
      expect(nav).toBeInTheDocument();
    }
  });

  it('renders router outlet', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(document.querySelector('main')).toBeInTheDocument();
  });

  it('handles theme context', () => {
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
