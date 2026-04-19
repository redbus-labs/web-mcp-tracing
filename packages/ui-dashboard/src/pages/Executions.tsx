import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Search } from 'lucide-react';
import { useAppContext } from '../components/AppContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Executions() {
  const { selectedApp, dateRange } = useAppContext();
  const [executions, setExecutions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toolFilter, setToolFilter] = useState('all');
  
  // Available tools for filter
  const [availableTools, setAvailableTools] = useState<string[]>([]);

  // Sheet State
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);

  const fetchExecutions = () => {
    let query = `?appId=${selectedApp}&dateRange=${dateRange}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (statusFilter !== 'all') query += `&status=${statusFilter}`;
    if (toolFilter !== 'all') query += `&toolName=${encodeURIComponent(toolFilter)}`;

    fetch(`/api/metrics/executions${query}`)
      .then((res) => res.json())
      .then((data) => {
        setExecutions(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchExecutions();
  }, [selectedApp, dateRange, search, statusFilter, toolFilter]);

  useEffect(() => {
    fetch(`/api/metrics/tools?appId=${selectedApp}&dateRange=${dateRange}`)
      .then(res => res.json())
      .then(data => setAvailableTools(data.map((t: any) => t.name)))
      .catch(console.error);
  }, [selectedApp, dateRange]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executions</h1>
        <p className="text-muted-foreground">Detailed log of all AI tool calls.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trace ID, tool name, or user query..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={toolFilter} onValueChange={setToolFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tool Name" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tools</SelectItem>
            {availableTools.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Status</TableHead>
              <TableHead>Tool Name</TableHead>
              <TableHead className="hidden md:table-cell">User Query</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="hidden lg:table-cell">Page URL</TableHead>
              <TableHead className="text-right">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No executions found.
                </TableCell>
              </TableRow>
            ) : (
              executions.map((ex) => (
                <TableRow 
                  key={ex.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedExecution(ex)}
                >
                  <TableCell>
                    {ex.status === 'SUCCESS' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{ex.toolName}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                    {ex.userQuery || '-'}
                  </TableCell>
                  <TableCell>{ex.executionTimeMs}ms</TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[150px] truncate text-muted-foreground">
                    {ex.pageUrl ? new URL(ex.pageUrl).pathname : '-'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(new Date(ex.createdAt), 'MMM d, HH:mm:ss')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {executions.length} of {total} results
      </div>

      {/* Execution Details Sheet */}
      <Sheet open={!!selectedExecution} onOpenChange={(open) => !open && setSelectedExecution(null)}>
        <SheetContent className="sm:max-w-[600px] w-[90vw] flex flex-col gap-0 p-0">
          {selectedExecution && (
            <>
              <SheetHeader className="p-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                  {selectedExecution.status === 'SUCCESS' ? (
                    <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200">Success</Badge>
                  ) : (
                    <Badge variant="destructive">Error</Badge>
                  )}
                  <SheetTitle className="text-xl">{selectedExecution.toolName}</SheetTitle>
                </div>
                <SheetDescription className="font-mono text-xs mt-1">
                  Trace ID: {selectedExecution.id}
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8">
                  {/* Context Section */}
                  <section className="space-y-3">
                    <h3 className="font-semibold tracking-tight text-sm uppercase text-muted-foreground">Context</h3>
                    <div className="space-y-4">
                      {selectedExecution.userQuery && (
                        <div className="bg-muted p-4 rounded-md border-l-4 border-primary italic">
                          "{selectedExecution.userQuery}"
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block mb-1">Session ID</span>
                          <span className="font-mono text-xs">{selectedExecution.sessionId || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Page URL</span>
                          <a href={selectedExecution.pageUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                            {selectedExecution.pageUrl || 'N/A'}
                          </a>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">App ID</span>
                          <span>{selectedExecution.appId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Timestamp</span>
                          <span>{format(new Date(selectedExecution.createdAt), 'PPpp')}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* I/O Payload */}
                  <section className="space-y-3">
                    <h3 className="font-semibold tracking-tight text-sm uppercase text-muted-foreground">I/O Payload</h3>
                    
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Arguments</span>
                      <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-auto max-h-[300px]">
                        {JSON.stringify(selectedExecution.arguments, null, 2)}
                      </pre>
                    </div>

                    {selectedExecution.status === 'ERROR' && selectedExecution.errorMessage && (
                      <div className="space-y-2 mt-4">
                        <span className="text-sm font-medium text-destructive">Error Message</span>
                        <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm border border-destructive/20 whitespace-pre-wrap">
                          {selectedExecution.errorMessage}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* API Traces */}
                  <section className="space-y-3">
                    <h3 className="font-semibold tracking-tight text-sm uppercase text-muted-foreground">
                      API Traces ({selectedExecution.apiTraces?.length || 0})
                    </h3>
                    
                    {selectedExecution.apiTraces && selectedExecution.apiTraces.length > 0 ? (
                      <div className="space-y-3">
                        {selectedExecution.apiTraces.map((trace: any) => (
                          <div key={trace.id} className="border rounded-md p-4 space-y-3 bg-card">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">{trace.httpMethod}</Badge>
                                <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]" title={trace.url}>
                                  {new URL(trace.url).pathname}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className={trace.statusCode >= 400 || trace.statusCode === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} variant="outline">
                                  {trace.statusCode || 'FAILED'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{trace.durationMs}ms</span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground break-all">
                              {trace.url}
                            </div>

                            {trace.requestHeaders && Object.keys(trace.requestHeaders).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">Headers</summary>
                                <pre className="mt-2 bg-muted p-2 rounded text-[10px] overflow-auto">
                                  {JSON.stringify(trace.requestHeaders, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No API calls traced during this execution.</div>
                    )}
                  </section>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}