import { TelemetryConfig, TelemetryEvent } from './types';

let config: TelemetryConfig | null = null;
let buffer: TelemetryEvent[] = [];
let flushTimeout: number | null = null;

export function initSender(telemetryConfig: TelemetryConfig) {
  config = telemetryConfig;
  
  // Flush on page unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushBuffer();
    }
  });
  window.addEventListener('pagehide', flushBuffer);
}

export function queueEvent(event: TelemetryEvent) {
  buffer.push(event);

  if (!flushTimeout) {
    flushTimeout = window.setTimeout(flushBuffer, 5000); // Flush every 5 seconds
  }
}

function flushBuffer() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (buffer.length === 0 || !config) return;

  const payload = JSON.stringify(buffer);
  buffer = []; // Clear buffer immediately

  try {
    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(config.endpoint, payload);
      if (!success) {
        // Fallback to fetch with keepalive if beacon fails
        fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(console.error);
      }
    } else {
      fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(console.error);
    }
  } catch (err) {
    console.error('Failed to send WebMCP telemetry', err);
  }
}
