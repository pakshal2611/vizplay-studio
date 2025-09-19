import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings, Trash2, GripVertical, Maximize2, Minimize2, Download, Filter } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from "recharts";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";
import type { DataRow, ColumnInfo } from "@/lib/dataUtils";

export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'area' | 'table' | 'kpi';

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  xAxis?: string;
  yAxis?: string;
  color?: string;
  group?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  filter?: string;
  isMaximized?: boolean;
}

interface ChartCardProps {
  config: ChartConfig;
  data: DataRow[];
  columns: ColumnInfo[];
  onUpdate: (config: ChartConfig) => void;
  onDelete: (id: string) => void;
  onExportImage?: (id: string) => void;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
];

export function ChartCard({ config, data, columns, onUpdate, onDelete, onExportImage }: ChartCardProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<ChartConfig>(config);
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSave = () => {
    onUpdate(editConfig);
    setIsConfigOpen(false);
  };

  const handleToggleMaximize = () => {
    onUpdate({ ...config, isMaximized: !config.isMaximized });
  };

  const handleExportImage = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `${config.title.replace(/\s+/g, '_').toLowerCase()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "Chart exported",
        description: "Your chart has been saved as an image.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export chart as image.",
        variant: "destructive",
      });
    }
  };

  const renderChart = () => {
    const chartConfig = {
      [config.yAxis || 'value']: {
        label: config.yAxis || 'Value',
        color: config.color || CHART_COLORS[0],
      },
    };

    if (!config.xAxis || !config.yAxis) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Settings className="h-8 w-8 mx-auto mb-2" />
            <p>Configure chart axes to display data</p>
          </div>
        </div>
      );
    }

    // Apply filters if specified
    let filteredData = data;
    if (config.filter) {
      try {
        filteredData = data.filter(row => {
          return Object.entries(row).some(([key, value]) =>
            String(value).toLowerCase().includes(config.filter!.toLowerCase())
          );
        });
      } catch (error) {
        // Ignore filter errors
      }
    }

    // Process and aggregate data
    let processedData = filteredData.map(row => ({
      ...row,
      [config.xAxis!]: String(row[config.xAxis!]),
      [config.yAxis!]: Number(row[config.yAxis!]) || 0,
    }));

    // Apply aggregation for grouped data
    if (config.aggregation && config.aggregation !== 'count') {
      const grouped = processedData.reduce((acc, row) => {
        const key = row[config.xAxis!];
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {} as Record<string, any[]>);

      processedData = Object.entries(grouped).map(([key, values]) => {
        const numericValues = values.map(v => Number(v[config.yAxis!]) || 0);
        let aggregatedValue = 0;

        switch (config.aggregation) {
          case 'sum':
            aggregatedValue = numericValues.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            aggregatedValue = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
            break;
          case 'min':
            aggregatedValue = Math.min(...numericValues);
            break;
          case 'max':
            aggregatedValue = Math.max(...numericValues);
            break;
          default:
            aggregatedValue = values.length;
        }

        return {
          [config.xAxis!]: key,
          [config.yAxis!]: aggregatedValue,
        };
      });
    }

    switch (config.type) {
      case 'bar':
        return (
          <ChartContainer config={chartConfig}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={config.yAxis} fill={config.color || CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        );

      case 'line':
        return (
          <ChartContainer config={chartConfig}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey={config.yAxis} 
                stroke={config.color || CHART_COLORS[0]} 
                strokeWidth={2}
                dot={{ fill: config.color || CHART_COLORS[0], strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        );

      case 'area':
        return (
          <ChartContainer config={chartConfig}>
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey={config.yAxis} 
                stroke={config.color || CHART_COLORS[0]} 
                fill={config.color || CHART_COLORS[0]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        );

      case 'scatter':
        return (
          <ChartContainer config={chartConfig}>
            <ScatterChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis dataKey={config.yAxis} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Scatter dataKey={config.yAxis} fill={config.color || CHART_COLORS[0]} />
            </ScatterChart>
          </ChartContainer>
        );

      case 'pie':
        const pieData = processedData.reduce((acc, row) => {
          const key = String(row[config.xAxis!]);
          const value = Number(row[config.yAxis!]) || 0;
          acc[key] = (acc[key] || 0) + value;
          return acc;
        }, {} as Record<string, number>);

        const pieChartData = Object.entries(pieData).map(([name, value]) => ({ name, value }));

        return (
          <ChartContainer config={chartConfig}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        );

      case 'table':
        return (
          <div className="overflow-x-auto max-h-64">
            <table className="data-table">
              <thead>
                <tr className="border-b">
                  {columns.slice(0, 5).map((col) => (
                    <th key={col.name} className="text-left p-2 font-medium text-sm">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    {columns.slice(0, 5).map((col) => (
                      <td key={col.name} className="p-2 text-sm">
                        {String(row[col.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'kpi':
        if (!config.yAxis) return null;
        const total = filteredData.reduce((sum, row) => sum + (Number(row[config.yAxis!]) || 0), 0);
        const average = total / filteredData.length;
        const max = Math.max(...filteredData.map(row => Number(row[config.yAxis!]) || 0));

        return (
          <div className="grid grid-cols-3 gap-4 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-1">{total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-2">{average.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-3">{max.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Maximum</div>
            </div>
          </div>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  const numericColumns = columns.filter(col => col.type === 'numeric');
  const allColumns = columns;

  return (
    <Card 
      ref={chartRef}
      className={`chart-container group transition-all duration-300 ${
        config.isMaximized 
          ? 'fixed inset-4 z-50 bg-background shadow-2xl' 
          : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardTitle className="text-lg">{config.title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {config.type}
          </Badge>
          {config.filter && (
            <Badge variant="secondary" className="text-xs">
              <Filter className="h-3 w-3 mr-1" />
              Filtered
            </Badge>
          )}
          {config.aggregation && config.aggregation !== 'count' && (
            <Badge variant="outline" className="text-xs">
              {config.aggregation.toUpperCase()}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleExportImage}
            title="Export as image"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleToggleMaximize}
            title={config.isMaximized ? "Minimize" : "Maximize"}
          >
            {config.isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Chart</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <input
                    id="title"
                    value={editConfig.title}
                    onChange={(e) => setEditConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="px-3 py-2 border rounded-md"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type">Chart Type</Label>
                  <Select
                    value={editConfig.type}
                    onValueChange={(value: ChartType) => setEditConfig(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                      <SelectItem value="scatter">Scatter Plot</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="table">Data Table</SelectItem>
                      <SelectItem value="kpi">KPI Tiles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editConfig.type !== 'table' && editConfig.type !== 'kpi' && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="x-axis">X Axis</Label>
                      <Select
                        value={editConfig.xAxis}
                        onValueChange={(value) => setEditConfig(prev => ({ ...prev, xAxis: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {allColumns.map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name} ({col.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="y-axis">Y Axis</Label>
                      <Select
                        value={editConfig.yAxis}
                        onValueChange={(value) => setEditConfig(prev => ({ ...prev, yAxis: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {numericColumns.map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {editConfig.type === 'kpi' && (
                  <div className="grid gap-2">
                    <Label htmlFor="kpi-column">Metric Column</Label>
                    <Select
                      value={editConfig.yAxis}
                      onValueChange={(value) => setEditConfig(prev => ({ ...prev, yAxis: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {numericColumns.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {editConfig.type !== 'table' && (
                  <div className="grid gap-2">
                    <Label htmlFor="aggregation">Aggregation Function</Label>
                    <Select
                      value={editConfig.aggregation || 'count'}
                      onValueChange={(value: 'sum' | 'avg' | 'count' | 'min' | 'max') => 
                        setEditConfig(prev => ({ ...prev, aggregation: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">Count</SelectItem>
                        <SelectItem value="sum">Sum</SelectItem>
                        <SelectItem value="avg">Average</SelectItem>
                        <SelectItem value="min">Minimum</SelectItem>
                        <SelectItem value="max">Maximum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="filter">Filter Data</Label>
                  <input
                    id="filter"
                    value={editConfig.filter || ''}
                    onChange={(e) => setEditConfig(prev => ({ ...prev, filter: e.target.value }))}
                    placeholder="Enter filter term..."
                    className="px-3 py-2 border rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Filter rows containing this text in any column
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(config.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={config.isMaximized ? "h-[calc(100vh-12rem)]" : "h-64"}>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}