import React from 'react';
import { render } from '@testing-library/react';
import Bock from './Bock';

test('renders learn react link', () => {
  const { getByText } = render(<Bock />);
  const linkElement = getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
