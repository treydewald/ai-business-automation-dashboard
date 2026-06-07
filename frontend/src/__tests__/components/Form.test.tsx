import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../../components/Form/Input';
import { Select } from '../../components/Form/Select';
import { Checkbox } from '../../components/Form/Checkbox';

describe('Form Components', () => {
  describe('Input Component', () => {
    it('renders input field', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('text');
    });

    it('handles input changes', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
    });

    it('supports different input types', () => {
      const { rerender } = render(<Input type="email" />);
      let input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('email');

      rerender(<Input type="password" />);
      input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('password');
    });

    it('disables input when disabled prop is true', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('renders with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('shows error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styling', () => {
      const { container } = render(<Input error="Error" />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('Select Component', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];

    it('renders select with options', () => {
      render(<Select options={options} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('handles selection changes', async () => {
      const handleChange = jest.fn();
      render(<Select options={options} onChange={handleChange} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await userEvent.selectOptions(select, 'option1');

      expect(handleChange).toHaveBeenCalled();
    });

    it('displays correct options', () => {
      render(<Select options={options} />);
      options.forEach(option => {
        expect(screen.getByText(option.label)).toBeInTheDocument();
      });
    });

    it('renders with label', () => {
      render(<Select options={options} label="Choose" />);
      expect(screen.getByLabelText('Choose')).toBeInTheDocument();
    });
  });

  describe('Checkbox Component', () => {
    it('renders checkbox', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('handles checkbox changes', async () => {
      const handleChange = jest.fn();
      render(<Checkbox onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      await userEvent.click(checkbox);

      expect(handleChange).toHaveBeenCalled();
    });

    it('renders with label', () => {
      render(<Checkbox label="I agree" />);
      expect(screen.getByLabelText('I agree')).toBeInTheDocument();
    });

    it('shows checked state', () => {
      render(<Checkbox checked={true} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('disables checkbox when disabled prop is true', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.disabled).toBe(true);
    });
  });
});
