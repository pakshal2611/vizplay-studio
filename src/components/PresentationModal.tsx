import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Maximize2, BarChart3 } from "lucide-react";
import { ChartCard, type ChartConfig } from "./ChartCard";
import type { DataRow, ColumnInfo } from "@/lib/dataUtils";
import { generateInsights } from "@/lib/dataUtils";

interface PresentationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charts: ChartConfig[];
  data: DataRow[];
  columns: ColumnInfo[];
}

export function PresentationModal({ open, onOpenChange, charts, data, columns }: PresentationModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    if (open && data.length > 0) {
      const generatedInsights = generateInsights(data);
      setInsights(generatedInsights);
    }
  }, [open, data]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % (charts.length + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + charts.length + 1) % (charts.length + 1));
  };

  useEffect(() => {
    if (open) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Escape') onOpenChange(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, charts.length]);

  const renderSlide = () => {
    if (currentSlide === 0) {
      // Overview slide
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-12">
          <div className="mb-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Data Dashboard Overview
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Analysis of {data.length} records across {columns.length} dimensions
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-chart-1">{data.length}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-chart-2">{columns.length}</div>
                <div className="text-sm text-muted-foreground">Columns</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-chart-3">{charts.length}</div>
                <div className="text-sm text-muted-foreground">Charts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-chart-4">{insights.length}</div>
                <div className="text-sm text-muted-foreground">Insights</div>
              </CardContent>
            </Card>
          </div>

          {insights.length > 0 && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
              <div className="space-y-2">
                {insights.slice(0, 3).map((insight, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-1">
                          {Math.round(insight.confidence * 100)}%
                        </Badge>
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Chart slide
    const chartIndex = currentSlide - 1;
    const chart = charts[chartIndex];
    const chartInsights = insights.filter(insight => 
      insight.description.toLowerCase().includes(chart.xAxis?.toLowerCase() || '') ||
      insight.description.toLowerCase().includes(chart.yAxis?.toLowerCase() || '')
    );

    return (
      <div className="h-full p-8">
        <div className="grid grid-cols-3 gap-8 h-full">
          {/* Chart */}
          <div className="col-span-2">
            <ChartCard
              config={chart}
              data={data}
              columns={columns}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          </div>

          {/* Insights */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Chart Analysis</h3>
              <Badge variant="outline">{chart.type} chart</Badge>
            </div>

            {chart.xAxis && chart.yAxis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Data Mapping</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>X-Axis:</strong> {chart.xAxis}</div>
                    <div><strong>Y-Axis:</strong> {chart.yAxis}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {chartInsights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Related Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {chartInsights.slice(0, 2).map((insight, index) => (
                      <div key={index} className="border-l-2 border-primary pl-3">
                        <div className="font-medium text-sm">{insight.title}</div>
                        <div className="text-xs text-muted-foreground">{insight.description}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Total Records:</strong> {data.length}</div>
                  {chart.yAxis && (
                    <>
                      <div><strong>Average:</strong> {
                        (data.reduce((sum, row) => sum + (Number(row[chart.yAxis!]) || 0), 0) / data.length).toFixed(2)
                      }</div>
                      <div><strong>Max:</strong> {
                        Math.max(...data.map(row => Number(row[chart.yAxis!]) || 0)).toLocaleString()
                      }</div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Presentation Mode</h2>
            <Badge variant="outline">
              Slide {currentSlide + 1} of {charts.length + 1}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevSlide} disabled={charts.length === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextSlide} disabled={charts.length === 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {renderSlide()}
        </div>

        {/* Footer */}
        <div className="border-t p-4 text-center text-sm text-muted-foreground">
          Use arrow keys to navigate • Press Esc to exit
        </div>
      </DialogContent>
    </Dialog>
  );
}