import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useAppContext } from '../components/AppContext';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function Sessions() {
  const { selectedApp, dateRange } = useAppContext();
  
  // Data States
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [search, setSearch] = useState('');
  
  const [executions, setExecutions] = useState<any[]>([]);
  
  // Selection States
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);

  // Fetch Sessions
  const fetchSessions = () => {
    let query = `?appId=${selectedApp}&dateRange=${dateRange}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;

    fetch(`/api/metrics/sessions${query}`)
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.items || []);
        setTotalSessions(data.total || 0);
        // Clear selections if new list fetched
        setSelectedSessionId(null);
        setSelectedExecution(null);
        setExecutions([]);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedApp, dateRange, search]);

  // Fetch Executions when Session selected
  useEffect(() => {
    if (!selectedSessionId) {
      setExecutions([]);
      setSelectedExecution(null);
      return;
    }

    let query = `?appId=${selectedApp}&dateRange=${dateRange}&sessionId=${selectedSessionId}&take=100`;
    fetch(`/api/metrics/executions${query}`)
      .then((res) => res.json())
      .then((data) => {
        setExecutions(data.items || []);
        setSelectedExecution(null);
      })
      .catch(console.error);
  }, [selectedSessionId, selectedApp, dateRange]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sessions Drilldown</h1>
        <p className="text-muted-foreground">Trace tools and API calls by session.</p>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        
        {/* Column 1: Sessions List */}
        <div className="flex flex-col border rounded-md bg-card overflow-hidden">
          <div className="p-3 border-b bg-muted/30">
            <h3 className="font-semibold mb-3">Sessions ({totalSessions})</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Client ID or Session ID..."
                className="pl-8 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {sessions.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No sessions found.</div>
              ) : (
                sessions.map((session) => (
                  <Card 
                    key={session.id} 
                    className={`p-3 cursor-pointer transition-colors border-l-4 space-y-2 ${
                      selectedSessionId === session.id 
                        ? 'bg-primary/5 border-l-primary border-primary/20' 
                        : 'hover:bg-muted/50 border-l-transparent'
                    }`}
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[11px] font-semibold truncate max-w-[150px] text-primary" title={session.id}>
                        {session.id}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {format(new Date(session.createdAt), 'MMM d, HH:mm:ss')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Client ID</span>
                        <span className="text-xs font-medium truncate" title={session.clientId || 'Anonymous'}>
                          {session.clientId || 'Anonymous'}
                        </span>
                      </div>
                      
                      {selectedApp === 'all' && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">App ID</span>
                          <span className="text-xs font-medium truncate" title={session.appId}>
                            {session.appId}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">User Agent</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={session.userAgent || 'Unknown'}>
                          {session.userAgent || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end items-end pt-1 border-t mt-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {session._count?.toolExecutions || 0} tools called
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Column 2: Tools Called */}
        <div className="flex flex-col border rounded-md bg-card overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex justify-between items-center h-[97px]">
            <h3 className="font-semibold">Tools Called</h3>
            <Badge variant="outline">{executions.length}</Badge>
          </div>
          <ScrollArea className="flex-1">
            {!selectedSessionId ? (
              <div className="h-full flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Select a session from the left to view tools called.
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {executions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No tools called in this session.</div>
                ) : (
                  executions.map((ex) => (
                    <Card 
                      key={ex.id}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedExecution?.id === ex.id 
                          ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedExecution(ex)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {ex.status === 'SUCCESS' ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive" />
                          )}
                          <span className="text-sm font-semibold truncate max-w-[140px]" title={ex.toolName}>
                            {ex.toolName}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {ex.executionTimeMs}ms
                        </span>
                      </div>
                      
                      {ex.userQuery && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-1.5 rounded truncate italic mb-2">
                          "{ex.userQuery}"
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(ex.createdAt), 'HH:mm:ss')}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          {ex.apiTraces?.length || 0} API calls
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Column 3: API Traces */}
        <div className="flex flex-col border rounded-md bg-card overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex justify-between items-center h-[97px]">
            <h3 className="font-semibold">API Traces</h3>
            <Badge variant="outline">{selectedExecution?.apiTraces?.length || 0}</Badge>
          </div>
          <ScrollArea className="flex-1">
            {!selectedExecution ? (
              <div className="h-full flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Select a tool execution to view its API traces.
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {!selectedExecution.apiTraces || selectedExecution.apiTraces.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No API calls traced for this tool.</div>
                ) : (
                  selectedExecution.apiTraces.map((trace: any) => (
                    <Card key={trace.id} className="p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                          {trace.httpMethod}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`text-[10px] ml-2 ${trace.statusCode >= 400 || trace.statusCode === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {trace.statusCode || 'FAIL'}
                        </Badge>
                      </div>
                      
                      <div className="text-xs font-mono break-all text-foreground mt-2">
                        {trace.url}
                      </div>

                      <div className="flex justify-between items-center pt-2 mt-2 border-t">
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(trace.createdAt), 'HH:mm:ss.SSS')}
                        </span>
                        <span className="text-xs font-medium">
                          {trace.durationMs}ms
                        </span>
                      </div>

                      {trace.requestHeaders && Object.keys(trace.requestHeaders).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-[10px] cursor-pointer text-muted-foreground hover:text-foreground mb-1">
                            Headers
                          </summary>
                          <pre className="bg-muted p-2 rounded text-[10px] overflow-auto max-h-32">
                            {JSON.stringify(trace.requestHeaders, null, 2)}
                          </pre>
                        </details>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>

      </div>
    </div>
  );
}