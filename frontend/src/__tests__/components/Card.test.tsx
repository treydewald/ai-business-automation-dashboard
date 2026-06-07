import { render, screen } from '@testing-library/react';
import { Card } from '../../components/Card';

describe('Card Component', () => {
  it('renders card with children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(
      <Card title="Card Title">
        <p>Content</p>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <Card description="Card description">
        <p>Content</p>
      </Card>
    );
    expect(screen.getByText('Card description')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(
      <Card>
        <p>Test</p>
      </Card>
    );
    const cardElement = container.querySelector('.rounded-lg');
    expect(cardElement).toBeInTheDocument();
  });

  it('supports custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <p>Test</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('renders footer when provided', () => {
    render(
      <Card footer={<p>Footer content</p>}>
        <p>Main content</p>
      </Card>
    );
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
