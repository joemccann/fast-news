import { render, screen } from '@testing-library/react';
import { NewsItem } from '@/components/NewsItem';
import type { NewsMessage } from '@/types/news';

describe('NewsItem', () => {
  const baseFlashMessage: NewsMessage = {
    type: 'flash',
    timestamp: '2024-01-15T10:30:00Z',
    headline: 'Breaking: Market Update',
    body: 'The market is experiencing volatility.',
    symbol: 'SPY',
  };

  const baseImpactMessage: NewsMessage = {
    type: 'flash_impact',
    timestamp: '2024-01-15T11:00:00Z',
    headline: 'Earnings Beat Expectations',
    body: 'Company reported strong Q4 results.',
    symbol: 'AAPL',
  };

  describe('flash type messages', () => {
    it('should render the headline', () => {
      render(<NewsItem message={baseFlashMessage} />);
      expect(screen.getByText('Breaking: Market Update')).toBeInTheDocument();
    });

    it('should render the body text', () => {
      render(<NewsItem message={baseFlashMessage} />);
      expect(screen.getByText('The market is experiencing volatility.')).toBeInTheDocument();
    });

    it('should render the symbol', () => {
      render(<NewsItem message={baseFlashMessage} />);
      expect(screen.getByText('SPY')).toBeInTheDocument();
    });

    it('should display FLASH badge', () => {
      render(<NewsItem message={baseFlashMessage} />);
      expect(screen.getByText('FLASH')).toBeInTheDocument();
    });

    it('should have blue styling for flash badge', () => {
      render(<NewsItem message={baseFlashMessage} />);
      const badge = screen.getByText('FLASH');
      expect(badge).toHaveClass('bg-blue-600/30');
      expect(badge).toHaveClass('text-blue-300');
    });

    it('should have zinc background for flash messages', () => {
      render(<NewsItem message={baseFlashMessage} />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('bg-zinc-900');
      expect(article).toHaveClass('border-zinc-800');
    });
  });

  describe('flash_impact type messages', () => {
    it('should render the headline', () => {
      render(<NewsItem message={baseImpactMessage} />);
      expect(screen.getByText('Earnings Beat Expectations')).toBeInTheDocument();
    });

    it('should render the body text', () => {
      render(<NewsItem message={baseImpactMessage} />);
      expect(screen.getByText('Company reported strong Q4 results.')).toBeInTheDocument();
    });

    it('should render the symbol', () => {
      render(<NewsItem message={baseImpactMessage} />);
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    it('should display IMPACT badge', () => {
      render(<NewsItem message={baseImpactMessage} />);
      expect(screen.getByText('IMPACT')).toBeInTheDocument();
    });

    it('should have amber styling for impact badge', () => {
      render(<NewsItem message={baseImpactMessage} />);
      const badge = screen.getByText('IMPACT');
      expect(badge).toHaveClass('bg-amber-600/30');
      expect(badge).toHaveClass('text-amber-300');
    });

    it('should have amber background for impact messages', () => {
      render(<NewsItem message={baseImpactMessage} />);
      const article = screen.getByRole('article');
      expect(article).toHaveClass('bg-amber-950/30');
      expect(article).toHaveClass('border-amber-800/50');
    });
  });

  describe('timestamp display', () => {
    it('should format and display timestamp', () => {
      render(<NewsItem message={baseFlashMessage} />);
      // The time element should be present
      const timeElement = screen.getByRole('article').querySelector('time');
      expect(timeElement).toBeInTheDocument();
    });

    it('should use current time if timestamp not provided', () => {
      const messageWithoutTimestamp: NewsMessage = {
        type: 'flash',
        timestamp: '',
        headline: 'No timestamp message',
      };
      render(<NewsItem message={messageWithoutTimestamp} />);
      const timeElement = screen.getByRole('article').querySelector('time');
      expect(timeElement).toBeInTheDocument();
    });
  });

  describe('optional fields', () => {
    it('should render without symbol', () => {
      const messageNoSymbol: NewsMessage = {
        type: 'flash',
        timestamp: '2024-01-15T10:30:00Z',
        headline: 'No symbol message',
      };
      render(<NewsItem message={messageNoSymbol} />);
      expect(screen.getByText('No symbol message')).toBeInTheDocument();
    });

    it('should render without body', () => {
      const messageNoBody: NewsMessage = {
        type: 'flash',
        timestamp: '2024-01-15T10:30:00Z',
        headline: 'Headline only',
      };
      render(<NewsItem message={messageNoBody} />);
      expect(screen.getByText('Headline only')).toBeInTheDocument();
    });

    it('should render JSON when no headline or body', () => {
      const messageMinimal: NewsMessage = {
        type: 'flash',
        timestamp: '2024-01-15T10:30:00Z',
      };
      render(<NewsItem message={messageMinimal} />);
      // Should render pre tag with JSON
      const preElement = screen.getByRole('article').querySelector('pre');
      expect(preElement).toBeInTheDocument();
    });
  });
});
