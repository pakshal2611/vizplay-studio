import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Database, AlertCircle } from "lucide-react";
import { parseCSV, analyzeData, type DataRow, type ColumnInfo } from "@/lib/dataUtils";
import { useToast } from "@/hooks/use-toast";
import employeeSalesData from "@/sample-data/employee_sales.json";

interface DataImporterProps {
  onDataImported: (data: DataRow[], columns: ColumnInfo[]) => void;
}

export function DataImporter({ onDataImported }: DataImporterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      const fileContent = await file.text();
      let data: DataRow[];

      if (file.name.endsWith('.csv')) {
        data = await parseCSV(fileContent);
      } else if (file.name.endsWith('.json')) {
        data = JSON.parse(fileContent);
      } else {
        throw new Error('Unsupported file format. Please upload CSV or JSON files.');
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid data format. Expected an array of objects.');
      }

      const columns = analyzeData(data);
      onDataImported(data, columns);
      
      toast({
        title: "Data imported successfully!",
        description: `Loaded ${data.length} rows with ${columns.length} columns`
      });
      
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleJsonPaste = () => {
    if (!jsonInput.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste JSON data in the text area",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = JSON.parse(jsonInput);
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid JSON format. Expected an array of objects.');
      }

      const columns = analyzeData(data);
      onDataImported(data, columns);
      
      toast({
        title: "Data imported successfully!",
        description: `Loaded ${data.length} rows with ${columns.length} columns`
      });
      
      setJsonInput("");
      
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Invalid JSON format",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    const columns = analyzeData(employeeSalesData);
    onDataImported(employeeSalesData, columns);
    
    toast({
      title: "Sample data loaded!",
      description: `Loaded ${employeeSalesData.length} rows of employee sales data`
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'bg-chart-1 text-white';
      case 'categorical': return 'bg-chart-3 text-white';
      case 'date': return 'bg-chart-5 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full justify-start bg-gradient-primary hover:opacity-90"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV/JSON File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* JSON Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Paste JSON data here..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <Button
            onClick={handleJsonPaste}
            disabled={isLoading || !jsonInput.trim()}
            variant="outline"
            className="w-full"
          >
            <FileText className="mr-2 h-4 w-4" />
            Import JSON Data
          </Button>
        </div>

        {/* Sample Data */}
        <div className="pt-2 border-t">
          <Button
            onClick={loadSampleData}
            variant="outline"
            className="w-full"
          >
            <Database className="mr-2 h-4 w-4" />
            Load Sample Data
          </Button>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Employee sales data with 20 rows
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Processing data...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DataPreviewProps {
  data: DataRow[];
  columns: ColumnInfo[];
}

export function DataPreview({ data, columns }: DataPreviewProps) {
  if (!data.length) return null;

  const previewRows = data.slice(0, 5);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'bg-chart-1';
      case 'categorical': return 'bg-chart-3';
      case 'date': return 'bg-chart-5';
      default: return 'bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Data Preview
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => (
            <Badge key={col.name} className={`${getTypeColor(col.type)} text-white`}>
              {col.name} ({col.type})
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="border-b">
                {columns.map((col) => (
                  <th key={col.name} className="text-left p-2 font-medium text-sm">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, index) => (
                <tr key={index} className="border-b border-border/50">
                  {columns.map((col) => (
                    <td key={col.name} className="p-2 text-sm">
                      {String(row[col.name] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 5 && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing 5 of {data.length} rows
          </p>
        )}
      </CardContent>
    </Card>
  );
}