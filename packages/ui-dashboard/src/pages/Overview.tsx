import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '../components/AppContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Overview() {
  const { selectedApp, dateRange } = useAppContext();
  const [summary, setSummary] = useState<any>(null);
  const [tools, setTools] = useState<any[]>([]);
  const [volume, setVolume] = useState<any[]>([]);

  useEffect(() => {
    const query = `?appId=${selectedApp}&dateRange=${dateRange}`;

    Promise.all([
      fetch(`/api/metrics/summary${query}`).then(res => res.json()),
      fetch(`/api/metrics/tools${query}`).then(res => res.json()),
      fetch(`/api/metrics/volume${query}`).then(res => res.json())
    ])
      .then(([summaryData, toolsData, volumeData]) => {
        setSummary(summaryData);
        setTools(toolsData);
        // format volume data
        setVolume(volumeData.map((d: any) => ({
          ...d,
          timeLabel: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      })
      .catch(console.error);
  }, [selectedApp, dateRange]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">High-level metrics for {selectedApp === 'all' ? 'All Apps' : selectedApp}</p>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalExecutions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${summary.errorCount > 0 ? (summary.errorCount / summary.totalExecutions > 0.05 ? 'text-destructive' : 'text-amber-500') : 'text-green-500'}`}>
                {summary.successRate ? (100 - summary.successRate).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(summary.avgExecutionTime)}ms</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.activeSessions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Execution Volume</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {volume.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volume}>
                  <XAxis dataKey="timeLabel" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="SUCCESS" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="ERROR" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Tools Used</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {tools.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tools} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}