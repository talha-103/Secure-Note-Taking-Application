import { render, screen } from '@testing-library/react';
import App from './App';

test('shows sign-in and public posts to a visitor', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Secure Notes' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Public posts' })).toBeInTheDocument();
});
