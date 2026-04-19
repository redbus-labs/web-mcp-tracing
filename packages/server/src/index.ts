import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ingestRouter from './routes/ingest';
import queryRouter from './routes/query';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : '*';

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
}));

// Parse raw body for sendBeacon support or standard JSON parsing
app.use(express.text({ type: 'text/plain' }));
app.use(express.json());

app.use('/api/collect', ingestRouter);
app.use('/api/metrics', queryRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`[WebMCP Telemetry Server] running on http://localhost:${port}`);
});
