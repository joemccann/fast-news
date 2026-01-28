import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import type { ConnectionStatus as Status } from '@/types/news';

describe('ConnectionStatus', () => {
  describe('connected state', () => {
    it('should display "Connected" label', () => {
      render(<ConnectionStatus status="connected" />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should show green indicator', () => {
      render(<ConnectionStatus status="connected" />);
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should not show retry button when connected', () => {
      const mockReconnect = jest.fn();
      render(<ConnectionStatus status="connected" onReconnect={mockReconnect} />);
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should not animate indicator when connected', () => {
      render(<ConnectionStatus status="connected" />);
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).not.toHaveClass('animate-pulse');
    });
  });

  describe('connecting state', () => {
    it('should display "Connecting" label', () => {
      render(<ConnectionStatus status="connecting" />);
      expect(screen.getByText('Connecting')).toBeInTheDocument();
    });

    it('should show yellow indicator', () => {
      render(<ConnectionStatus status="connecting" />);
      const indicator = document.querySelector('.bg-yellow-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should not show retry button when connecting', () => {
      const mockReconnect = jest.fn();
      render(<ConnectionStatus status="connecting" onReconnect={mockReconnect} />);
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should animate indicator when connecting', () => {
      render(<ConnectionStatus status="connecting" />);
      const indicator = document.querySelector('.bg-yellow-500');
      expect(indicator).toHaveClass('animate-pulse');
    });
  });

  describe('disconnected state', () => {
    it('should display "Disconnected" label', () => {
      render(<ConnectionStatus status="disconnected" />);
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should show red indicator', () => {
      render(<ConnectionStatus status="disconnected" />);
      const indicator = document.querySelector('.bg-red-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should show retry button when disconnected and onReconnect provided', () => {
      const mockReconnect = jest.fn();
      render(<ConnectionStatus status="disconnected" onReconnect={mockReconnect} />);
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should not show retry button when disconnected but no onReconnect', () => {
      render(<ConnectionStatus status="disconnected" />);
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should call onReconnect when retry clicked', () => {
      const mockReconnect = jest.fn();
      render(<ConnectionStatus status="disconnected" onReconnect={mockReconnect} />);
      fireEvent.click(screen.getByText('Retry'));
      expect(mockReconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('error state', () => {
    it('should display "Error" label', () => {
      render(<ConnectionStatus status="error" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should show red indicator', () => {
      render(<ConnectionStatus status="error" />);
      const indicator = document.querySelector('.bg-red-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should show retry button when error and onReconnect provided', () => {
      const mockReconnect = jest.fn();
      render(<ConnectionStatus status="error" onReconnect={mockReconnect} />);
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call onReconnect when retry clicked', () => {
      const mockReconnect = jest.fn();
      render(<ConnectionStatus status="error" onReconnect={mockReconnect} />);
      fireEvent.click(screen.getByText('Retry'));
      expect(mockReconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    const statuses: Status[] = ['connected', 'connecting', 'disconnected', 'error'];

    statuses.forEach((status) => {
      it(`should have correct structure for ${status} state`, () => {
        render(<ConnectionStatus status={status} />);
        // Check indicator is a small dot
        const indicator = document.querySelector('.w-2.h-2.rounded-full');
        expect(indicator).toBeInTheDocument();
      });
    });

    it('should have correct button styling', () => {
      const mockReconnect = jest.fn();
      render(<ConnectionStatus status="disconnected" onReconnect={mockReconnect} />);
      const button = screen.getByText('Retry');
      expect(button).toHaveClass('bg-zinc-800');
      expect(button).toHaveClass('hover:bg-zinc-700');
      expect(button).toHaveClass('rounded');
    });
  });
});
