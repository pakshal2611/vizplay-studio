import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/TopNav";
import { DataImporter, DataPreview } from "@/components/DataImporter";
import { ChartCard, type ChartConfig, type ChartType } from "@/components/ChartCard";
import { InsightPanel } from "@/components/InsightPanel";
import { ChartModal } from "@/components/ChartModal";
import { PresentationModal } from "@/components/PresentationModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, PanelLeftClose, PanelLeftOpen, Grid, BarChart3, Presentation } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import type { DataRow, ColumnInfo } from "@/lib/dataUtils";

function SortableChartCard({ chart, data, columns, onUpdate, onDelete }: {
  chart: ChartConfig;
  data: DataRow[];
  columns: ColumnInfo[];
  onUpdate: (config: ChartConfig) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: chart.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ChartCard
        config={chart}
        data={data}
        columns={columns}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const userData = localStorage.getItem("vd_user");
    if (!userData) {
      navigate("/auth");
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleDataImported = (newData: DataRow[], newColumns: ColumnInfo[]) => {
    setData(newData);
    setColumns(newColumns);
    
    // Create initial charts based on data structure
    const initialCharts: ChartConfig[] = [];
    
    if (newColumns.length >= 2) {
      const numericCols = newColumns.filter(col => col.type === 'numeric');
      const categoricalCols = newColumns.filter(col => col.type === 'categorical');
      
      if (numericCols.length > 0 && categoricalCols.length > 0) {
        // Add a bar chart
        initialCharts.push({
          id: `chart-${Date.now()}-1`,
          type: 'bar',
          title: 'Overview Chart',
          xAxis: categoricalCols[0].name,
          yAxis: numericCols[0].name,
        });
      }
      
      if (numericCols.length >= 2) {
        // Add a scatter plot
        initialCharts.push({
          id: `chart-${Date.now()}-2`,
          type: 'scatter',
          title: 'Correlation Analysis',
          xAxis: numericCols[0].name,
          yAxis: numericCols[1].name,
        });
      }
      
      // Add a data table
      initialCharts.push({
        id: `chart-${Date.now()}-3`,
        type: 'table',
        title: 'Data Table',
      });
    }
    
    setCharts(initialCharts);
  };

  const addChart = (type: ChartType) => {
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
    };
    setCharts(prev => [...prev, newChart]);
  };

  const addMultipleCharts = (types: ChartType[]) => {
    const newCharts: ChartConfig[] = types.map(type => ({
      id: `chart-${Date.now()}-${Math.random()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
    }));
    setCharts(prev => [...prev, ...newCharts]);
  };

  const updateChart = (updatedChart: ChartConfig) => {
    setCharts(prev => prev.map(chart => 
      chart.id === updatedChart.id ? updatedChart : chart
    ));
  };

  const deleteChart = (chartId: string) => {
    setCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setCharts((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <div className="flex" data-dashboard>
        {/* Left Panel */}
        <motion.div
          initial={false}
          animate={{ width: leftPanelCollapsed ? 0 : 320 }}
          transition={{ duration: 0.3 }}
          className="border-r bg-surface/50 overflow-hidden"
        >
          <div className="w-80 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Data & Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftPanelCollapsed(true)}
                className="h-8 w-8"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
            
            <DataImporter onDataImported={handleDataImported} />
            
            {data.length > 0 && (
              <DataPreview data={data} columns={columns} />
            )}
          </div>
        </motion.div>

        {/* Left Panel Toggle (when collapsed) */}
        {leftPanelCollapsed && (
          <div className="fixed left-0 top-16 z-50 p-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLeftPanelCollapsed(false)}
              className="h-8 w-8 bg-background shadow-md"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Data Visualization Dashboard
                </h1>
                <p className="text-muted-foreground">
                  {data.length > 0 
                    ? `Analyzing ${data.length} rows across ${columns.length} columns`
                    : "Import data to start creating visualizations"
                  }
                </p>
              </div>
              
              {data.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsPresentationMode(true)}
                    disabled={charts.length === 0}
                  >
                    <Presentation className="mr-2 h-4 w-4" />
                    Present
                  </Button>
                  <Button
                    onClick={() => setIsChartModalOpen(true)}
                    className="bg-chart-1 hover:opacity-90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Chart
                  </Button>
                </div>
              )}
            </div>

            {/* Charts Grid */}
            {charts.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={charts.map(c => c.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {charts.map((chart) => (
                      <SortableChartCard
                        key={chart.id}
                        chart={chart}
                        data={data}
                        columns={columns}
                        onUpdate={updateChart}
                        onDelete={deleteChart}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : data.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>Ready to Visualize</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Your data is loaded! Start creating charts to discover insights.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => addChart('bar')} variant="outline" size="sm">
                        Bar Chart
                      </Button>
                      <Button onClick={() => addChart('line')} variant="outline" size="sm">
                        Line Chart
                      </Button>
                      <Button onClick={() => addChart('pie')} variant="outline" size="sm">
                        Pie Chart
                      </Button>
                      <Button onClick={() => addChart('kpi')} variant="outline" size="sm">
                        KPI Tiles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="max-w-md mx-auto">
                  <Grid className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Data Loaded</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload a CSV or JSON file, paste data, or load our sample dataset to get started.
                  </p>
                  <Button 
                    onClick={() => setLeftPanelCollapsed(false)}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Import Data
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <motion.div
          initial={false}
          animate={{ 
            width: rightPanelCollapsed ? 0 : rightPanelExpanded ? 600 : 320 
          }}
          transition={{ duration: 0.3 }}
          className="border-l bg-surface/50 overflow-hidden"
        >
          <div className={`${rightPanelExpanded ? 'w-[600px]' : 'w-80'} p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Insights & Export</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightPanelCollapsed(true)}
                className="h-8 w-8"
              >
                <PanelLeftClose className="h-4 w-4 rotate-180" />
              </Button>
            </div>
            
            <InsightPanel 
              data={data} 
              columns={columns} 
              isExpanded={rightPanelExpanded}
              onToggleExpanded={() => setRightPanelExpanded(!rightPanelExpanded)}
            />
          </div>
        </motion.div>

        {/* Right Panel Toggle (when collapsed) */}
        {rightPanelCollapsed && (
          <div className="fixed right-0 top-16 z-50 p-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRightPanelCollapsed(false)}
              className="h-8 w-8 bg-background shadow-md"
            >
              <PanelLeftOpen className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}

        {/* Chart Selection Modal */}
        <ChartModal
          open={isChartModalOpen}
          onOpenChange={setIsChartModalOpen}
          onSelectChart={addChart}
          onSelectMultipleCharts={addMultipleCharts}
        />

        {/* Presentation Modal */}
        <PresentationModal
          open={isPresentationMode}
          onOpenChange={setIsPresentationMode}
          charts={charts}
          data={data}
          columns={columns}
        />
      </div>
    </div>
  );
}