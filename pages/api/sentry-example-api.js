/**
 * @swagger
 * /api/sentry-example-api:
 *   get:
 *     summary: Sentry Example API Route
 *     description: This route just throws an error. We don't have sentry configured so it doesn't do anything useful.
 *     responses:
 *       200:
 *         description: Successful response (never reached)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: John Doe
 *       500:
 *         description: Sentry Example API Route Error
 */

// A faulty API route to test Sentry's error monitoring
export default function handler(_req, res) {
  throw new Error("Sentry Example API Route Error");
  res.status(200).json({ name: "John Doe" });
}
