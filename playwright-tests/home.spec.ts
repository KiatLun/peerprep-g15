import { expect, test } from '@playwright/test';
import { sampleQuestions, seedLocalStorage } from './fixtures';

test.describe('Home and matching flows', () => {
    test.beforeEach(async ({ page }) => {
        await seedLocalStorage(page, {
            accessToken: 'access-token-user',
            userId: 'u-user',
            name: 'Shane',
        });
    });

    test('filters questions and can queue then cancel matching', async ({ page }) => {
        await page.route('**/questions', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(sampleQuestions),
                });
                return;
            }
            await route.fallback();
        });

        let joinCalls = 0;
        await page.route('**/matching/join', async (route) => {
            joinCalls += 1;
            expect(route.request().method()).toBe('POST');
            const payload = JSON.parse(route.request().postData() ?? '{}');
            expect(payload).toMatchObject({
                userId: 'u-user',
                topic: 'Array',
                difficulty: 'easy',
            });

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'Queued successfully',
                    entry: { userId: 'u-user' },
                }),
            });
        });

        await page.route('**/matching/status/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ state: 'queued' }),
            });
        });

        await page.route('**/matching/leave', async (route) => {
            expect(route.request().method()).toBe('POST');
            const payload = JSON.parse(route.request().postData() ?? '{}');
            expect(payload).toEqual({ userId: 'u-user' });

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Left queue' }),
            });
        });

        await page.goto('/home');
        await expect(page.getByText('Welcome, Shane!')).toBeVisible();
        await expect(page.getByText('Array Sum')).toBeVisible();
        await expect(page.getByText('Linked List Basics')).toBeVisible();

        await page.getByLabel('Difficulty').selectOption('Easy');
        await page.getByLabel('Category').selectOption('Array');
        await page.getByRole('button', { name: 'Find Match' }).click();

        await expect(page.getByText('Waiting for another user to join...')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await expect(page.getByText('Array Sum')).toBeVisible();
        await expect(page.getByText('Linked List Basics')).toHaveCount(0);

        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByText('Matching cancelled.')).toBeVisible();
        expect(joinCalls).toBe(1);
    });

    test('navigates straight to a collaboration room when a match is found', async ({ page }) => {
        await page.route('**/questions', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(sampleQuestions),
            });
        });

        await page.route('**/matching/join', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    match: {
                        matchId: 'room-123',
                        userIds: ['u-user', 'u-partner'],
                        question: { questionId: 103 },
                    },
                }),
            });
        });

        await page.goto('/home');
        await page.getByLabel('Difficulty').selectOption('Hard');
        await page.getByLabel('Category').selectOption('Graph');
        await page.getByRole('button', { name: 'Find Match' }).click();

        await expect(page).toHaveURL('/collab/room-123');
    });
});
