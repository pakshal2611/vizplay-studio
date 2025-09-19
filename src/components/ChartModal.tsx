import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LineChart, ScatterChart, PieChart, AreaChart, Table, TrendingUp } from "lucide-react";
import type { ChartType } from "./ChartCard";

interface ChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectChart: (type: ChartType) => void;
  onSelectMultipleCharts: (types: ChartType[]) => void;
}

const chartTypes = [
  { type: 'bar' as ChartType, name: 'Bar Chart', icon: BarChart3, description: 'Compare categories' },
  { type: 'line' as ChartType, name: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
  { type: 'area' as ChartType, name: 'Area Chart', icon: AreaChart, description: 'Filled line chart' },
  { type: 'scatter' as ChartType, name: 'Scatter Plot', icon: ScatterChart, description: 'Correlation analysis' },
  { type: 'pie' as ChartType, name: 'Pie Chart', icon: PieChart, description: 'Part-to-whole relationships' },
  { type: 'table' as ChartType, name: 'Data Table', icon: Table, description: 'Raw data view' },
  { type: 'kpi' as ChartType, name: 'KPI Tiles', icon: TrendingUp, description: 'Key metrics' },
];

export function ChartModal({ open, onOpenChange, onSelectChart, onSelectMultipleCharts }: ChartModalProps) {
  const [selectedCharts, setSelectedCharts] = useState<ChartType[]>([]);

  const toggleChart = (type: ChartType) => {
    setSelectedCharts(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleAddSelected = () => {
    if (selectedCharts.length > 0) {
      onSelectMultipleCharts(selectedCharts);
      setSelectedCharts([]);
      onOpenChange(false);
    }
  };

  const handleSingleSelect = (type: ChartType) => {
    onSelectChart(type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Charts</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {chartTypes.map((chart) => {
            const Icon = chart.icon;
            const isSelected = selectedCharts.includes(chart.type);
            
            return (
              <Card 
                key={chart.type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => toggleChart(chart.type)}
              >
                <CardHeader className="text-center p-4">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-sm">{chart.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    {chart.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleSelect(chart.type);
                      }}
                    >
                      Add Single
                    </Button>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedCharts.length > 0 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {selectedCharts.length} chart{selectedCharts.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedCharts([])}>
                Clear Selection
              </Button>
              <Button onClick={handleAddSelected}>
                Add Selected Charts
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}