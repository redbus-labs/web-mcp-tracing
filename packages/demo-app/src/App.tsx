import { useState } from 'react';
import { useWebMCP } from 'usewebmcp';

export default function App() {
  const [logs, setLogs] = useState<{ id: string; message: string; isError: boolean }[]>([]);

  const addLog = (message: string, isError = false) => {
    setLogs((prev) => [
      { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), message: `[${new Date().toLocaleTimeString()}] ${message}`, isError },
      ...prev,
    ]);
  };

  // 1. Tool: get_weather (Uses fetch to a public API)
  useWebMCP({
    name: 'get_weather',
    description: 'Get the current weather',
    inputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      }
    },
    execute: async (args: any) => {
      addLog(`Executing get_weather for ${args.location}...`);
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.7143&longitude=-74.006&current_weather=true');
      const data = await res.json();
      addLog(`Weather result: ${data.current_weather.temperature}°C`);
      return data;
    }
  });

  // 2. Tool: calculate_shipping (Tests artificial duration)
  useWebMCP({
    name: 'calculate_shipping',
    description: 'Calculate shipping cost',
    inputSchema: {
      type: 'object',
      properties: {
        weight: { type: 'number' }
      }
    },
    execute: async (args: any) => {
      addLog(`Executing calculate_shipping for ${args.weight}kg...`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const cost = args.weight * 5.25;
      addLog(`Shipping cost: $${cost}`);
      return { cost };
    }
  });

  // 3. Tool: book_flight (Failure test and 404 API tracing)
  useWebMCP({
    name: 'book_flight',
    description: 'Book a flight',
    inputSchema: {
      type: 'object',
      properties: {
        destination: { type: 'string' }
      }
    },
    execute: async (args: any) => {
      addLog(`Executing book_flight to ${args.destination}...`);
      try {
        await fetch('https://api.github.com/non-existent-endpoint');
      } catch (e) {
        // Ignored for test purposes
      }

      const err = new Error(`Failed to book flight to ${args.destination}. Payment declined.`);
      addLog(`Flight booking failed: ${err.message}`, true);
      throw err;
    }
  });

  const handleWeather = async () => {
    try {
      await (window as any).mcpInstance.callTool('get_weather', {
        location: 'NYC',
        user_query: 'What is the weather like in New York today?',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleShipping = async () => {
    try {
      await (window as any).mcpInstance.callTool('calculate_shipping', {
        weight: 12,
        user_query: 'How much to ship a 12kg package?',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFlight = async () => {
    try {
      await (window as any).mcpInstance.callTool('book_flight', {
        destination: 'London',
        user_query: 'Book me a flight to London for tomorrow.',
      });
    } catch (e) {
      console.error('Expected error:', e);
    }
  };

  return (
    <div>
      <h1>WebMCP Telemetry Demo App</h1>
      <p>This demo application registers simulated WebMCP tools using React and artificially triggers them to test telemetry capture.</p>

      <div className="actions">
        <button onClick={handleWeather}>Trigger get_weather (Success API call)</button>
        <button onClick={handleShipping}>Trigger calculate_shipping (Duration test)</button>
        <button onClick={handleFlight}>Trigger book_flight (Error test)</button>
      </div>

      <div className="logs">
        {logs.map((log) => (
          <p key={log.id} style={{ color: log.isError ? 'red' : 'inherit' }}>
            {log.message}
          </p>
        ))}
      </div>
    </div>
  );
}
