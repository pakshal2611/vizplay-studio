import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Download, Copy, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { generateInsights, type DataRow, type DataInsight, type ColumnInfo } from "@/lib/dataUtils";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface InsightPanelProps {
  data: DataRow[];
  columns: ColumnInfo[];
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export function InsightPanel({ data, columns, isExpanded = false, onToggleExpanded }: InsightPanelProps) {
  const [insights, setInsights] = useState<DataInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();

  const generateAIInsights = async () => {
    if (!data.length) {
      toast({
        title: "No data available",
        description: "Please import data first to generate insights",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const newInsights = generateInsights(data);
      setInsights(newInsights);
      setIsGenerating(false);
      
      toast({
        title: "Insights generated!",
        description: `Found ${newInsights.length} insights in your data`
      });
    }, 2000);
  };

  const exportDashboardAsPDF = async () => {
    try {
      const dashboard = document.querySelector('[data-dashboard]') as HTMLElement;
      if (!dashboard) {
        toast({
          title: "Export failed",
          description: "Dashboard not found",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Exporting...",
        description: "Generating PDF of your dashboard"
      });

      const canvas = await html2canvas(dashboard, {
        scale: 2,
        useCORS: true,
        allowTaint: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('dashboard-export.pdf');

      toast({
        title: "Export successful!",
        description: "Dashboard exported as PDF"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  const exportDashboardAsPNG = async () => {
    try {
      const dashboard = document.querySelector('[data-dashboard]') as HTMLElement;
      if (!dashboard) {
        toast({
          title: "Export failed",
          description: "Dashboard not found",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Exporting...",
        description: "Generating PNG of your dashboard"
      });

      const canvas = await html2canvas(dashboard, {
        scale: 2,
        useCORS: true,
        allowTaint: false
      });

      const link = document.createElement('a');
      link.download = 'dashboard-export.png';
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Export successful!",
        description: "Dashboard exported as PNG"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to generate PNG",
        variant: "destructive"
      });
    }
  };

  const exportDataAsCSV = () => {
    if (!data.length) {
      toast({
        title: "No data to export",
        description: "Please import data first",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      columns.map(col => col.name).join(','),
      ...data.map(row => columns.map(col => `"${row[col.name] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data-export.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported!",
      description: "CSV file downloaded successfully"
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'correlation': return TrendingUp;
      case 'outlier': return AlertTriangle;
      case 'trend': return TrendingUp;
      case 'categorical': return Lightbulb;
      default: return Lightbulb;
    }
  };

  const getInsightColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-success';
    if (confidence >= 0.6) return 'bg-warning';
    return 'bg-muted';
  };

  const suggestedCharts = columns.length > 0 ? [
    {
      title: "Revenue Trend",
      description: "Line chart showing revenue over time",
      type: "line",
      suggested: columns.some(col => col.name.toLowerCase().includes('date')) && 
                 columns.some(col => col.name.toLowerCase().includes('revenue'))
    },
    {
      title: "Regional Performance",
      description: "Bar chart comparing regions",
      type: "bar",
      suggested: columns.some(col => col.name.toLowerCase().includes('region'))
    },
    {
      title: "Product Distribution",
      description: "Pie chart of product categories",
      type: "pie",
      suggested: columns.some(col => col.name.toLowerCase().includes('product'))
    },
    {
      title: "Sales Metrics",
      description: "KPI tiles for key metrics",
      type: "kpi",
      suggested: columns.some(col => col.type === 'numeric')
    }
  ].filter(chart => chart.suggested) : [];

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={generateAIInsights}
            disabled={isGenerating || !data.length}
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Analyzing Data...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>

          {insights.length > 0 && (
            <div className="space-y-3">
              {insights.map((insight, index) => {
                const IconComponent = getInsightIcon(insight.type);
                return (
                  <div key={index} className="p-3 rounded-lg border bg-card/50">
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-4 w-4 mt-0.5 ${getInsightColor(insight.confidence)}`} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <Badge className={`${getConfidenceBadge(insight.confidence)} text-white text-xs`}>
                            {Math.round(insight.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Charts */}
      {suggestedCharts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-chart-5" />
              Suggested Charts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedCharts.map((chart, index) => (
                <div key={index} className="p-2 rounded border hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="font-medium text-sm">{chart.title}</div>
                  <div className="text-xs text-muted-foreground">{chart.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-chart-3" />
            Export & Share
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={exportDashboardAsPNG}
            variant="outline"
            className="w-full justify-start"
          >
            <Download className="mr-2 h-4 w-4" />
            Export as PNG
          </Button>
          
          <Button
            onClick={exportDashboardAsPDF}
            variant="outline"
            className="w-full justify-start"
          >
            <Download className="mr-2 h-4 w-4" />
            Export as PDF
          </Button>
          
          <Separator />
          
          <Button
            onClick={exportDataAsCSV}
            variant="outline"
            className="w-full justify-start"
            disabled={!data.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data as CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}