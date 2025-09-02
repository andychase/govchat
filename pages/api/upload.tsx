/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file to Azure OpenAI and optionally associate with a vector store.
 *     description: Accepts multipart/form-data file uploads. Returns file IDs from Azure OpenAI.
 *     tags:
 *       - Upload
 *     parameters:
 *       - in: query
 *         name: vectorStoreId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional vector store ID to associate the uploaded file.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload.
 *     responses:
 *       200:
 *         description: File(s) uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 description: Uploaded file ID.
 *       400:
 *         description: Error parsing form data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       405:
 *         description: Method not allowed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: File upload failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createAzureOpenAI } from '@/utils/lib/azure';
import busboy from 'busboy';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

export const config = {
    api: { bodyParser: false },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const openAI = createAzureOpenAI();

    const vectorStoreId = typeof req.query.vectorStoreId === 'string' ? req.query.vectorStoreId : undefined;

    try {
        const bb = busboy({ headers: req.headers });
        const uploadPromises: Promise<any>[] = [];

        bb.on('file', (fieldname, file, filename) => {
            // Randomuuid is used to prevent directory traversal attacks
            const tmpPath = path.join(os.tmpdir(), `${randomUUID()}.tmp`);
            const writeStream = fs.createWriteStream(tmpPath);

            file.pipe(writeStream);

            const uploadPromise = new Promise(async (resolve, reject) => {
                writeStream.on('finish', async () => {
                    try {
                        const fileStream = fs.createReadStream(tmpPath);
                        // Monkey patch in the filename for metadata, do not overwrite .path
                        (fileStream as any).name = filename.filename;
                        const result = await openAI.files.create({
                            purpose: 'assistants',
                            file: fileStream,
                        });

                        if (vectorStoreId) {
                            await openAI.beta.vectorStores.files.create(
                                vectorStoreId,
                                { file_id: result.id }
                            );
                        }

                        fs.unlink(tmpPath, () => { });
                        resolve(result);
                    } catch (error: any) {
                        fs.unlink(tmpPath, () => { });
                        reject(error);
                    }
                });
                writeStream.on('error', reject);
            });

            uploadPromises.push(uploadPromise);
        });

        bb.on('finish', async () => {
            try {
                const results = uploadPromises.length > 0 ? await Promise.all(uploadPromises) : [];
                res.status(200).json(results.map((r: any) => r.id));
            } catch (error: any) {
                res.status(500).json({ error: error.message || 'File upload failed' });
            }
        });

        bb.on('error', () => {
            res.status(400).json({ error: 'Error parsing form data' });
        });

        req.pipe(bb);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'File upload failed' });
    }
};


export default handler;
