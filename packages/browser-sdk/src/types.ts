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
  promptTraceId?: string;
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

export interface PromptTraceEvent {
  type: 'prompt_trace';
  traceId: string;
  sessionId: string;
  appId: string;
  prompt: string;
  response: string;
  executionTimeMs: number;
  timestamp: number;
}

export type TelemetryEvent = ToolExecutionEvent | ApiTraceEvent | PromptTraceEvent;
