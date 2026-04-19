import { useState } from 'react';
import { useWebMCP } from 'usewebmcp';

export default function App() {
  const [logs, setLogs] = useState<{ id: string; message: string; isError: boolean }[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [isPrompting, setIsPrompting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

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

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const LanguageModel = (window as any).LanguageModel;
    if (!LanguageModel || typeof LanguageModel.create !== 'function') {
      alert('Chrome Prompt API (LanguageModel) is not supported. Please enable the required flags.');
      return;
    }

    setIsPrompting(true);
    addLog(`Sending query to Prompt API: "${userQuery}"`);

    try {
      const availability = await LanguageModel.availability();
      if (availability === 'unavailable') {
        alert('The language model cannot run on this device.');
        setIsPrompting(false);
        return;
      }

      const needsDownload = availability !== 'available';
      if (needsDownload) {
        setIsDownloading(true);
        setDownloadProgress(0);
        addLog('Model download triggered. Please wait...');
      }

      const schema = {
        type: "object",
        properties: {
          toolName: {
            type: "string",
            enum: ["get_weather", "calculate_shipping", "book_flight"],
            description: "The name of the tool to execute"
          },
          args: {
            type: "object",
            description: "The arguments required for the tool"
          }
        },
        required: ["toolName", "args"],
        additionalProperties: false
      };

      const session = await LanguageModel.create({
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            const isFraction = e.total === undefined || e.total === 0;
            const progress = isFraction ? e.loaded : (e.loaded / e.total);
            setDownloadProgress(Math.round(progress * 100));
            if (needsDownload && progress >= 1) {
              addLog('Download complete! Extracting and loading into memory...');
            }
          });
        },
        systemPrompt: `You are an intent routing assistant. Your job is to select the correct tool based on the user's query.
Available tools:
1. get_weather (requires "location" string)
2. calculate_shipping (requires "weight" number)
3. book_flight (requires "destination" string)`
      });

      if (needsDownload) {
        setIsDownloading(false);
        addLog('Model successfully loaded into memory.');
      }

      const response = await session.prompt(userQuery, {
        responseConstraint: schema
      });
      addLog(`Prompt API responded: ${response}`);

      // Try parsing the JSON
      let parsed;
      try {
        // Strip markdown code block if LLM included it despite instructions
        const cleanResponse = response.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        parsed = JSON.parse(cleanResponse);
      } catch (parseErr) {
        throw new Error('Failed to parse Prompt API response as JSON: ' + response);
      }

      if (!parsed.toolName || !parsed.args) {
        throw new Error('Prompt API response missing toolName or args fields');
      }

      addLog(`Calling tool ${parsed.toolName} with args ${JSON.stringify(parsed.args)}`);
      
      // Execute the corresponding tool
      await (window as any).mcpInstance.callTool(parsed.toolName, {
        ...parsed.args,
        user_query: userQuery,
      });

    } catch (err: any) {
      addLog(`Prompt API Error: ${err.message}`, true);
      setIsDownloading(false);
    } finally {
      setIsPrompting(false);
      setUserQuery('');
    }
  };

  return (
    <div>
      <h1>WebMCP Telemetry Demo App</h1>
      <p>This demo application registers simulated WebMCP tools using React and artificially triggers them to test telemetry capture.</p>

      <div className="prompt-section">
        <h2>Test Prompt API Routing</h2>
        <p>Type a request to use the local Chrome AI model to select the right tool.</p>
        <form onSubmit={handlePromptSubmit} className="prompt-form">
          <input
            type="text"
            className="prompt-input"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="e.g. What is the weather like in New York today?"
            disabled={isPrompting}
          />
          <button type="submit" className="prompt-button" disabled={isPrompting || !userQuery.trim()}>
            {isPrompting ? (isDownloading ? `Downloading Model: ${downloadProgress}%` : 'Thinking...') : 'Submit'}
          </button>
        </form>
        {isDownloading && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            <em>Model is downloading/extracting for the first time. This may take a few moments. Progress: {downloadProgress}%</em>
          </div>
        )}
      </div>

      <div className="actions">
        <h2>Manual Tool Execution</h2>
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
