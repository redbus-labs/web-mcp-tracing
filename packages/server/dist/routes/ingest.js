"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    try {
        let payload = req.body;
        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload);
            }
            catch (e) {
                return res.status(400).json({ error: 'Invalid JSON payload' });
            }
        }
        if (!Array.isArray(payload)) {
            return res.status(400).json({ error: 'Payload must be an array of events' });
        }
        // Process events
        for (const event of payload) {
            if (event.type === 'tool_execution') {
                const { traceId, appId, clientId, sessionId, pageUrl, toolName, arguments: toolArgs, userQuery, status, errorMessage, executionTimeMs, } = event;
                // Upsert Session
                if (sessionId) {
                    await db_1.default.session.upsert({
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
                await db_1.default.toolExecution.create({
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
                    },
                });
            }
            else if (event.type === 'api_trace') {
                const { traceId, toolExecutionId, url, httpMethod, statusCode, durationMs, requestHeaders, } = event;
                // Create API Trace
                await db_1.default.apiTrace.create({
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
    }
    catch (error) {
        console.error('Failed to ingest telemetry payload', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
