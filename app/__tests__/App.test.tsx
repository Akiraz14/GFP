import { render, screen } from '@testing-library/react-native';
import App from '../App';

describe('App base', () => {
  test('renderiza la pantalla base con el nombre visible GFP', async () => {
    await render(<App />);

    expect(screen.getByTestId('app-base')).toBeTruthy();
    expect(screen.getByText('GFP')).toBeTruthy();
    expect(screen.getByText('Gestión Financiera Personal')).toBeTruthy();
  });
});
