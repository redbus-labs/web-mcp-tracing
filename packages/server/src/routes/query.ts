import { Router } from 'express';
import prisma from '../db';

const router = Router();

// Middleware to extract standard filters
const getFilters = (req: any) => {
  const { appId, dateRange } = req.query;
  const where: any = {};
  
  if (appId && appId !== 'all') {
    where.appId = String(appId);
  }
  
  if (dateRange) {
    const now = new Date();
    let startDate = new Date();
    if (dateRange === '24h') {
      startDate.setHours(now.getHours() - 24);
    } else if (dateRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    }
    
    if (dateRange !== 'all') {
      where.createdAt = { gte: startDate };
    }
  }
  
  return where;
};

// GET /api/metrics/apps
router.get('/apps', async (req, res) => {
  try {
    const apps = await prisma.toolExecution.groupBy({
      by: ['appId'],
      _count: { appId: true },
      orderBy: { _count: { appId: 'desc' } }
    });
    res.json(apps.map(a => a.appId));
  } catch (error) {
    console.error('Failed to fetch apps', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/metrics/summary
router.get('/summary', async (req, res) => {
  try {
    const where = getFilters(req);
    
    const totalExecutions = await prisma.toolExecution.count({ where });
    const successfulExecutions = await prisma.toolExecution.count({
      where: { ...where, status: 'SUCCESS' },
    });
    const errorExecutions = totalExecutions - successfulExecutions;
    
    const activeSessions = await prisma.session.count({
      where: { 
        appId: where.appId,
        createdAt: where.createdAt
      }
    });
    
    const avgResult = await prisma.toolExecution.aggregate({
      where,
      _avg: { executionTimeMs: true },
    });

    res.json({
      totalExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      errorCount: errorExecutions,
      avgExecutionTime: avgResult._avg.executionTimeMs || 0,
      activeSessions
    });
  } catch (error) {
    console.error('Failed to fetch summary metrics', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/metrics/tools
router.get('/tools', async (req, res) => {
  try {
    const where = getFilters(req);
    const toolCounts = await prisma.toolExecution.groupBy({
      where,
      by: ['toolName'],
      _count: { toolName: true },
      orderBy: { _count: { toolName: 'desc' } },
      take: 10
    });

    res.json(toolCounts.map((t: any) => ({ name: t.toolName, count: t._count.toolName })));
  } catch (error) {
    console.error('Failed to fetch tools metrics', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/metrics/volume
router.get('/volume', async (req, res) => {
  try {
    const where = getFilters(req);
    
    // Simple approach: get all and group in memory if DB grouping by date is complex
    const executions = await prisma.toolExecution.findMany({
      where,
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by hour or day depending on range
    const grouped = executions.reduce((acc: any, curr) => {
      const dateStr = curr.createdAt.toISOString().substring(0, 13) + ':00:00Z'; // group by hour
      if (!acc[dateStr]) acc[dateStr] = { time: dateStr, SUCCESS: 0, ERROR: 0 };
      acc[dateStr][curr.status]++;
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Failed to fetch volume', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/metrics/executions
router.get('/executions', async (req, res) => {
  try {
    const { status, toolName, search, sessionId, skip = 0, take = 50 } = req.query;
    const where = getFilters(req);

    if (status && status !== 'all') where.status = String(status);
    if (toolName && toolName !== 'all') where.toolName = String(toolName);
    if (sessionId) where.sessionId = String(sessionId);
    
    if (search) {
      where.OR = [
        { id: { contains: String(search), mode: 'insensitive' } },
        { toolName: { contains: String(search), mode: 'insensitive' } },
        { userQuery: { contains: String(search), mode: 'insensitive' } },
        { sessionId: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.toolExecution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
        include: { apiTraces: true, promptTrace: true }
      }),
      prisma.toolExecution.count({ where })
    ]);

    res.json({ items, total });
  } catch (error) {
    console.error('Failed to fetch executions', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/metrics/prompts
router.get('/prompts', async (req, res) => {
  try {
    const { skip = 0, take = 50, sessionId } = req.query;
    const baseWhere = getFilters(req);
    const where: any = {};
    
    if (baseWhere.appId) where.appId = baseWhere.appId;
    if (baseWhere.createdAt) where.createdAt = baseWhere.createdAt;
    if (sessionId) where.sessionId = String(sessionId);

    const [items, total] = await Promise.all([
      prisma.promptTrace.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
        include: {
          toolExecutions: {
            select: { toolName: true }
          }
        }
      }),
      prisma.promptTrace.count({ where })
    ]);

    res.json({ items, total });
  } catch (error) {
    console.error('Failed to fetch prompt traces', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/metrics/sessions
router.get('/sessions', async (req, res) => {
  try {
    const { search, skip = 0, take = 50 } = req.query;
    const baseWhere = getFilters(req);
    const where: any = {};
    
    if (baseWhere.appId) where.appId = baseWhere.appId;
    if (baseWhere.createdAt) where.createdAt = baseWhere.createdAt;
    
    if (search) {
      where.OR = [
        { id: { contains: String(search), mode: 'insensitive' } },
        { clientId: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
        include: {
          _count: {
            select: { toolExecutions: true }
          }
        }
      }),
      prisma.session.count({ where })
    ]);

    res.json({ items, total });
  } catch (error) {
    console.error('Failed to fetch sessions', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/metrics/traces
router.get('/traces', async (req, res) => {
  try {
    const { skip = 0, take = 50 } = req.query;
    const baseWhere = getFilters(req);
    const where: any = {};
    
    if (baseWhere.appId || baseWhere.createdAt) {
      where.toolExecution = {};
      if (baseWhere.appId) where.toolExecution.appId = baseWhere.appId;
      if (baseWhere.createdAt) where.toolExecution.createdAt = baseWhere.createdAt;
    }

    const [items, total] = await Promise.all([
      prisma.apiTrace.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(take),
        include: {
          toolExecution: {
            select: { toolName: true }
          }
        }
      }),
      prisma.apiTrace.count({ where })
    ]);

    res.json({ items, total });
  } catch (error) {
    console.error('Failed to fetch traces', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/metrics/recent
router.get('/recent', async (req, res) => {
  try {
    const where = getFilters(req);
    const recent = await prisma.toolExecution.findMany({
      where,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        apiTraces: true,
        promptTrace: true,
      },
    });

    res.json(recent);
  } catch (error) {
    console.error('Failed to fetch recent executions', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;