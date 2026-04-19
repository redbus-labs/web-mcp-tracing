import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAppContext } from '../components/AppContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Traces() {
  const { selectedApp, dateRange } = useAppContext();
  const [traces, setTraces] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const fetchTraces = () => {
    let query = `?appId=${selectedApp}&dateRange=${dateRange}`;

    fetch(`/api/metrics/traces${query}`)
      .then((res) => res.json())
      .then((data) => {
        setTraces(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchTraces();
  }, [selectedApp, dateRange]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Traces</h1>
        <p className="text-muted-foreground">Raw view of all outgoing API calls made by the tools.</p>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Method</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Tool Name</TableHead>
              <TableHead className="text-right">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {traces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No API traces found.
                </TableCell>
              </TableRow>
            ) : (
              traces.map((trace) => (
                <TableRow key={trace.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {trace.httpMethod}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        trace.statusCode >= 400 || trace.statusCode === 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }
                      variant="outline"
                    >
                      {trace.statusCode || 'FAILED'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-sm truncate" title={trace.url}>
                    {trace.url}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {trace.durationMs}ms
                  </TableCell>
                  <TableCell className="font-medium">
                    {trace.toolExecution?.toolName || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(new Date(trace.createdAt), 'MMM d, HH:mm:ss')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {traces.length} of {total} results
      </div>
    </div>
  );
}