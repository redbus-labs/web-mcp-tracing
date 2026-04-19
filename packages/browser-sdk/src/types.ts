export interface TelemetryConfig {
  endpoint: string;
  appId: string;
  clientId?: string;
  sessionId?: string;
}

export interface ToolExecutionEvent {
  type: 'tool_execution';
  traceId: string;
  appId: string;
  clientId?: string;
  sessionId: string;
  pageUrl: string;
  toolName: string;
  arguments: any;
  userQuery?: string;
  status: 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  executionTimeMs: number;
  timestamp: number;
}

export interface ApiTraceEvent {
  type: 'api_trace';
  traceId: string;
  toolExecutionId: string;
  url: string;
  httpMethod: string;
  statusCode?: number;
  durationMs: number;
  requestHeaders?: Record<string, string>;
  timestamp: number;
}

export type TelemetryEvent = ToolExecutionEvent | ApiTraceEvent;
