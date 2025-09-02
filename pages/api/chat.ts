import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import { ChatBody, Message } from '@/types/chat';

import { NextApiRequest, NextApiResponse } from 'next';

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Chat with AI model
 *     description: Streams chat responses from the selected AI model.
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 description: Model name (default: gpt4)
 *               messages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Message'
 *               key:
 *                 type: string
 *                 description: NOT USED
 *               prompt:
 *                 type: string
 *                 description: System prompt. Users can control this and override it.
 *               temperature:
 *                 type: number
 *                 description: Model "temperature", 0-2 I think. Only some models support it.
 *               assistantId:
 *                 type: string
 *                 description: Assistant ID (optional), used for files. Comes from getid route.
 *               vectorStoreId:
 *                 type: string
 *                 description: Vector store ID (optional), used for files.
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: NOT USED. Files used are from the assistantId / vectorStoreId
 *     responses:
 *       200:
 *         description: Streamed chat response
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       500:
 *         description: Error response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    }
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse<any>) => {
  try {
    const { model, messages, key, prompt, temperature, assistantId, vectorStoreId, fileIds } = req.body as ChatBody;
    let promptToSend = prompt || DEFAULT_SYSTEM_PROMPT;
    let temperatureToUse = temperature ?? DEFAULT_TEMPERATURE;
    let messagesToSend: Message[] = [];

    // Reverse loop through the messages to add them until the token limit is reached
    for (let i = messages.length - 1; i >= 0; i--) {
      const message: Message = messages[i];
      messagesToSend = [message, ...messagesToSend];
    }

    //const principalName: string = req.headers['x-ms-client-principal-name']?.toString() || "";
    //const bearer: string = req.headers['x-ms-token-aad-access-token']?.toString() || req.headers['x-ms-client-principal']?.toString() || "";
    //const bearerAuth: string = req.headers['x-ms-client-principal-id']?.toString() || "";
    const userName: string = req.headers['x-ms-client-principal-name']?.toString() || "";

    const stream = await OpenAIStream (
      model,
      promptToSend,
      temperature,
      messages,
      userName,
      assistantId,
      vectorStoreId,
      fileIds
    );

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();


    if (!stream) {
      res.status(500).send('Failed to create OpenAI stream');
      return;
    }
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    const processStream = async () => {
      let done = false;
      while (!done) {

        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          res.write(chunk);
        }
      }
      res.end();
    };
    
    try {
      await processStream();
      // res.end();
    } catch (error) {
      console.error('chat.ts - Error processing stream:', error);
      reader.cancel();
      res.end();
    }
    reader.releaseLock();

  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
};

export default handler;
