import { TelemetryConfig } from './types';
import { initSender } from './sender';
import { initPatcher } from './patcher';

function init(config: TelemetryConfig) {
  if (!config || !config.endpoint || !config.appId) {
    console.error('[WebMCPTelemetry] Invalid configuration. Missing endpoint or appId.');
    return;
  }

  // Automatically manage session ID using sessionStorage if not provided
  let sessionId = config.sessionId;
  if (!sessionId) {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionId = sessionStorage.getItem('webmcp_telemetry_session_id') || undefined;
      if (!sessionId) {
        sessionId = crypto.randomUUID 
          ? crypto.randomUUID() 
          : 'session_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('webmcp_telemetry_session_id', sessionId);
      }
    } else {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    }
  }

  const finalConfig = { ...config, sessionId };

  initSender(finalConfig);
  initPatcher(finalConfig);
  
  console.log(`[WebMCPTelemetry] Initialized for app: ${config.appId}`);
}

const WebMCPTelemetry = {
  init,
};

// Make it available globally for browser usage
if (typeof window !== 'undefined') {
  (window as any).WebMCPTelemetry = WebMCPTelemetry;
}

export default WebMCPTelemetry;
