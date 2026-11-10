import { render, screen } from '@testing-library/react';
import App from './App';

test('shows sign-in and hides posts from a visitor', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Secure Notes' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Posts' })).not.toBeInTheDocument();
});
