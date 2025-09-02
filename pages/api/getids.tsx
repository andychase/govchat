import type { NextApiRequest, NextApiResponse } from 'next';
import { DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { createAzureOpenAI } from '@/utils/lib/azure';

/**
 * @swagger
 * /api/getids:
 *   get:
 *     summary: Generate assistant and vector store IDs for files
 *     description: These ids are assumed to be very random and unique so though they aren't authenticated that aren't guessable. Files on here only last 30 days.
 *     tags:
 *       - IDs
 *     responses:
 *       200:
 *         description: List of IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Error response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const openAI = createAzureOpenAI();

    try {
        const assistant = await openAI.beta.assistants.create({
            model: DEFAULT_MODEL, // The model can be overwritten by the thread
            tools: [{ type: "file_search" }]
        });
        const vectorStore = await openAI.beta.vectorStores.create({
            expires_after: {
                anchor: 'last_active_at',
                days: 30
            }
        });
        res.status(200).json({ assistantId: assistant.id, vectorStoreId: vectorStore.id });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || 'Failed to create assistant/vector store' });
    }
}