import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { App } from './App';
import { ThemeProvider } from './contexts/ThemeContext';

describe('App', () => {
  it('renders landing page', () => {
    render(
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    );
    expect(screen.getByText('YART')).toBeInTheDocument();
    expect(screen.getByText('Yet Another Retro Tool')).toBeInTheDocument();
  });
});
