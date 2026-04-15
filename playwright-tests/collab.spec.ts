import { expect, test } from '@playwright/test';
import { seedLocalStorage } from './fixtures';

test.describe('Collaboration shell', () => {
    test('renders the waiting room state for a fresh room', async ({ page }) => {
        await seedLocalStorage(page, {
            accessToken: 'access-token-user',
            userId: 'u-user',
            name: 'Shane',
        });

        await page.goto('/collab/room-abc');
        await expect(page.getByText('Select Language')).toBeVisible();
        await expect(page.getByText('Waiting for partner to join...')).toBeVisible();
        await expect(page.getByText('Chat')).toBeVisible();
    });
});
