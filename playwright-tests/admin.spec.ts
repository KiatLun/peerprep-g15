import { expect, test } from '@playwright/test';
import { adminUsers, sampleQuestions, seedLocalStorage } from './fixtures';

test.describe('Admin flows', () => {
    test.beforeEach(async ({ page }) => {
        await seedLocalStorage(page, {
            accessToken: 'access-token-admin',
            userId: 'u-admin',
            name: 'Admin Annie',
        });
    });

    test('loads the admin dashboard with recent questions and users', async ({ page }) => {
        await page.route('**/questions**', async (route) => {
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

        await page.route('**/admin/users**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ users: adminUsers }),
            });
        });

        await page.goto('/admin/home');
        await expect(page.getByText('Admin Dashboard')).toBeVisible();
        await expect(page.getByText('Total Questions')).toBeVisible();
        await expect(page.getByText('Total Users')).toBeVisible();
        await expect(page.getByText('Array Sum')).toBeVisible();
        await expect(page.getByText('alice@example.com')).toBeVisible();
    });

    test('searches, adds, edits, and deletes questions', async ({ page }) => {
        const questions: any[] = [...sampleQuestions];

        await page.route('**/questions**', async (route) => {
            const url = new URL(route.request().url());
            const method = route.request().method();

            if (method === 'GET' && url.pathname === '/questions') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(questions),
                });
                return;
            }

            if (method === 'POST' && url.pathname === '/questions') {
                const payload = JSON.parse(route.request().postData() ?? '{}');
                expect(payload).toMatchObject({
                    questionId: 104,
                    title: 'Binary Search',
                    difficulty: 'Medium',
                    sourceUrl: 'https://example.com/binary-search',
                });
                questions.push({
                    questionId: payload.questionId,
                    title: payload.title,
                    description: payload.description,
                    categories: payload.categories,
                    difficulty: payload.difficulty,
                    sourceUrl: payload.sourceUrl,
                    testCases: [],
                    supportedLanguages: ['python'],
                });
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'created' }),
                });
                return;
            }

            if (method === 'PUT' && url.pathname === '/questions/101') {
                const payload = JSON.parse(route.request().postData() ?? '{}');
                expect(payload).toMatchObject({
                    questionId: 101,
                    title: 'Array Sum Updated',
                    difficulty: 'Easy',
                });
                questions[0] = {
                    ...questions[0],
                    title: payload.title,
                    description: payload.description,
                    categories: payload.categories,
                    difficulty: payload.difficulty,
                    sourceUrl: payload.sourceUrl,
                } as (typeof questions)[number];
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'updated' }),
                });
                return;
            }

            if (method === 'DELETE' && url.pathname === '/questions/102') {
                expect(route.request().headers().authorization).toBe('Bearer access-token-admin');
                questions.splice(1, 1);
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'deleted' }),
                });
                return;
            }

            await route.fallback();
        });

        await page.goto('/admin/questions');
        await expect(page.getByRole('heading', { name: 'Questions' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Question' })).toBeVisible();

        await page.getByLabel('Difficulty').selectOption('Hard');
        await page.getByLabel('Category').selectOption('Graph');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByText('Graph Paths')).toBeVisible();
        await expect(page.getByText('Array Sum')).toHaveCount(0);

        await page.getByRole('button', { name: 'Add Question' }).click();
        await expect(page).toHaveURL('/admin/questions/add-question');
        await expect(page.getByRole('heading', { name: 'Add Question' })).toBeVisible();
        await expect(page.getByLabel('Question ID')).toHaveValue('104');

        await page.getByLabel('Title').fill('Binary Search');
        await page.getByLabel('Description').fill('Find an element in a sorted array.');
        await page.getByLabel('Categories').fill('Array, Search');
        await page.getByLabel('Difficulty').selectOption('Medium');
        await page.getByLabel('Source URL').fill('https://example.com/binary-search');
        await page.getByRole('button', { name: 'Add Question' }).click();
        await expect(page).toHaveURL('/admin/questions');
        await expect(page.getByText('Binary Search')).toBeVisible();

        await page.getByRole('button', { name: 'Edit' }).first().click();
        await expect(page).toHaveURL('/admin/questions/edit-question/101');
        await expect(page.getByRole('heading', { name: 'Edit Question' })).toBeVisible();
        await page.getByLabel('Title').fill('Array Sum Updated');
        await page.getByRole('button', { name: 'Update Question' }).click();
        await expect(page).toHaveURL('/admin/questions');
        await expect(page.getByText('Array Sum Updated')).toBeVisible();

        page.once('dialog', (dialog) => dialog.accept());
        await page.getByRole('button', { name: 'Delete' }).nth(1).click();
        await expect(page.getByText('Linked List Basics')).toHaveCount(0);
    });

    test('searches users and applies role actions', async ({ page }) => {
        await page.route('**/admin/users**', async (route) => {
            const method = route.request().method();
            const url = new URL(route.request().url());

            if (method === 'GET' && url.pathname === '/admin/users') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ users: adminUsers }),
                });
                return;
            }

            if (method === 'POST' && url.pathname === '/admin/promote') {
                const payload = JSON.parse(route.request().postData() ?? '{}');
                expect(payload).toEqual({ username: 'alice' });
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'promoted' }),
                });
                return;
            }

            if (method === 'POST' && url.pathname === '/admin/demote') {
                const payload = JSON.parse(route.request().postData() ?? '{}');
                expect(payload).toEqual({ username: 'alice' });
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'demoted' }),
                });
                return;
            }

            if (method === 'DELETE' && url.pathname === '/admin/users/alice') {
                expect(route.request().headers().authorization).toBe('Bearer access-token-admin');
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'deleted' }),
                });
                return;
            }

            await route.fallback();
        });

        await page.goto('/admin/users');
        await expect(page.getByText('Users')).toBeVisible();
        await expect(page.getByText('alice@example.com')).toBeVisible();

        await page.getByLabel('Username').fill('alice');
        await page.getByLabel('Role').selectOption('user');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByText('alice@example.com')).toBeVisible();
        await expect(page.getByText('bob@example.com')).toHaveCount(0);

        page.once('dialog', (dialog) => dialog.accept());
        await page.getByRole('button', { name: 'Promote' }).click();

        page.once('dialog', (dialog) => dialog.accept());
        await page.getByRole('button', { name: 'Demote' }).click();

        page.once('dialog', (dialog) => dialog.accept());
        await page.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('alice@example.com')).toHaveCount(0);
    });
});
