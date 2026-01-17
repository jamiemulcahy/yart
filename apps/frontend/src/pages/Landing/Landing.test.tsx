import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Landing } from './Landing';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockFetch = vi.fn();

describe('Landing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubGlobal('fetch', mockFetch);
  });

  const renderLanding = (): void => {
    render(
      <ThemeProvider>
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      </ThemeProvider>
    );
  };

  it('renders title and subtitle', () => {
    renderLanding();

    expect(screen.getByText('YART')).toBeInTheDocument();
    expect(screen.getByText('Yet Another Retro Tool')).toBeInTheDocument();
  });

  it('renders all template options', () => {
    renderLanding();

    expect(screen.getByTestId('template-mad-sad-glad')).toBeInTheDocument();
    expect(screen.getByTestId('template-start-stop-continue')).toBeInTheDocument();
    expect(screen.getByTestId('template-liked-learned-lacked')).toBeInTheDocument();
    expect(screen.getByTestId('template-blank')).toBeInTheDocument();
  });

  it('has mad-sad-glad selected by default', () => {
    renderLanding();

    const madSadGlad = screen.getByTestId('template-mad-sad-glad');
    expect(madSadGlad).toHaveClass('border-blue-500');
  });

  it('allows selecting different templates', () => {
    renderLanding();

    const startStopContinue = screen.getByTestId('template-start-stop-continue');
    fireEvent.click(startStopContinue);

    expect(startStopContinue).toHaveClass('border-blue-500');
    expect(screen.getByTestId('template-mad-sad-glad')).not.toHaveClass('border-blue-500');
  });

  it('renders create room button', () => {
    renderLanding();

    expect(screen.getByTestId('create-room-btn')).toBeInTheDocument();
    expect(screen.getByTestId('create-room-btn')).toHaveTextContent('Create Room');
  });

  it('creates room and navigates on success', async () => {
    const mockRoomId = 'test-room-123';
    const mockAdminToken = 'admin-token-456';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ roomId: mockRoomId, adminToken: mockAdminToken }),
    });

    renderLanding();

    fireEvent.click(screen.getByTestId('create-room-btn'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/room/${mockRoomId}`);
    });

    expect(localStorage.getItem(`room:${mockRoomId}:adminToken`)).toBe(mockAdminToken);
  });

  it('shows creating state while request is in progress', async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(promise);

    renderLanding();

    fireEvent.click(screen.getByTestId('create-room-btn'));

    expect(screen.getByTestId('create-room-btn')).toHaveTextContent('Creating...');
    expect(screen.getByTestId('create-room-btn')).toBeDisabled();

    // Clean up
    resolvePromise!({
      ok: true,
      json: async () => ({ roomId: 'room-1', adminToken: 'token-1' }),
    });
  });

  it('shows error message on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderLanding();

    fireEvent.click(screen.getByTestId('create-room-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to create room. Please try again.')).toBeInTheDocument();
  });

  it('sends selected template in request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ roomId: 'room-1', adminToken: 'token-1' }),
    });

    renderLanding();

    // Select a different template
    fireEvent.click(screen.getByTestId('template-start-stop-continue'));

    fireEvent.click(screen.getByTestId('create-room-btn'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: 'start-stop-continue' }),
      });
    });
  });
});
