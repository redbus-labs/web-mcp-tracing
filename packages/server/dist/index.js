"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const ingest_1 = __importDefault(require("./routes/ingest"));
const query_1 = __importDefault(require("./routes/query"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*';
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
}));
// Parse raw body for sendBeacon support or standard JSON parsing
app.use(express_1.default.text({ type: 'text/plain' }));
app.use(express_1.default.json());
app.use('/api/collect', ingest_1.default);
app.use('/api/metrics', query_1.default);
// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.listen(port, () => {
    console.log(`[WebMCP Telemetry Server] running on http://localhost:${port}`);
});
