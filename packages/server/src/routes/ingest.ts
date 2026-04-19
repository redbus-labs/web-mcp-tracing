import { Router } from 'express';
import prisma from '../db';

const router = Router();

router.post('/', async (req, res) => {
  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    }

    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: 'Payload must be an array of events' });
    }

    // Process events
    for (const event of payload) {
      if (event.type === 'tool_execution') {
        const {
          traceId,
          appId,
          clientId,
          sessionId,
          pageUrl,
          toolName,
          arguments: toolArgs,
          userQuery,
          status,
          errorMessage,
          executionTimeMs,
          promptTraceId,
        } = event;

        // Upsert Session
        if (sessionId) {
          await prisma.session.upsert({
            where: { id: sessionId },
            update: {
              appId,
              clientId: clientId || null,
              userAgent: req.headers['user-agent'] || null,
            },
            create: {
              id: sessionId,
              appId,
              clientId: clientId || null,
              userAgent: req.headers['user-agent'] || null,
            },
          });
        }

        // Create Tool Execution
        await prisma.toolExecution.create({
          data: {
            id: traceId,
            appId,
            sessionId: sessionId || null,
            pageUrl,
            toolName,
            arguments: toolArgs,
            userQuery,
            status,
            errorMessage,
            executionTimeMs,
            promptTraceId: promptTraceId || null,
          },
        });
      } else if (event.type === 'prompt_trace') {
        const {
          traceId,
          sessionId,
          appId,
          prompt,
          response,
          executionTimeMs,
        } = event;

        // Upsert Session if not exists
        if (sessionId) {
          await prisma.session.upsert({
            where: { id: sessionId },
            update: {
              appId,
              userAgent: req.headers['user-agent'] || null,
            },
            create: {
              id: sessionId,
              appId,
              userAgent: req.headers['user-agent'] || null,
            },
          });
        }

        // Create Prompt Trace
        await prisma.promptTrace.create({
          data: {
            id: traceId,
            sessionId: sessionId || null,
            appId,
            prompt,
            response,
            executionTimeMs,
          },
        });
      } else if (event.type === 'api_trace') {
        const {
          traceId,
          toolExecutionId,
          url,
          httpMethod,
          statusCode,
          durationMs,
          requestHeaders,
        } = event;

        // Create API Trace
        await prisma.apiTrace.create({
          data: {
            id: traceId,
            toolExecutionId,
            url,
            httpMethod,
            statusCode,
            durationMs,
            requestHeaders: requestHeaders || {},
          },
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to ingest telemetry payload', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
