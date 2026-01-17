import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders landing page', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByText('YART')).toBeInTheDocument();
    expect(screen.getByText('Yet Another Retro Tool')).toBeInTheDocument();
  });
});
