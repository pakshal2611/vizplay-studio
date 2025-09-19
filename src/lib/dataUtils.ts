import Papa from 'papaparse';

export interface DataRow {
  [key: string]: any;
}

export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'date';
  values: any[];
}

export interface DataInsight {
  title: string;
  description: string;
  confidence: number;
  type: 'correlation' | 'outlier' | 'trend' | 'categorical';
}

export interface FilterRule {
  column: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'range';
  value: any;
  enabled: boolean;
}

export interface ComputedField {
  name: string;
  expression: string;
  type: 'numeric' | 'categorical' | 'date';
}

// Data type detection
export function detectColumnType(values: any[]): 'numeric' | 'categorical' | 'date' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) return 'categorical';
  
  // Check for dates
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const isDate = nonNullValues.every(v => datePattern.test(String(v)));
  if (isDate) return 'date';
  
  // Check for numbers
  const isNumeric = nonNullValues.every(v => {
    const num = Number(v);
    return !isNaN(num) && isFinite(num);
  });
  if (isNumeric) return 'numeric';
  
  return 'categorical';
}

// Parse CSV data
export function parseCSV(csvContent: string): Promise<DataRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
        } else {
          resolve(results.data as DataRow[]);
        }
      },
      error: (error) => reject(error)
    });
  });
}

// Analyze data structure
export function analyzeData(data: DataRow[]): ColumnInfo[] {
  if (!data || data.length === 0) return [];
  
  const columns = Object.keys(data[0]);
  
  return columns.map(column => {
    const values = data.map(row => row[column]);
    const type = detectColumnType(values);
    
    return {
      name: column,
      type,
      values: [...new Set(values)].slice(0, 50) // Limit unique values for performance
    };
  });
}

// Calculate correlation between two numeric columns
export function calculateCorrelation(data: DataRow[], col1: string, col2: string): number {
  const pairs = data
    .map(row => [Number(row[col1]), Number(row[col2])])
    .filter(([x, y]) => !isNaN(x) && !isNaN(y));
  
  if (pairs.length < 2) return 0;
  
  const n = pairs.length;
  const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
  const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
  const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
  const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
  const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// Find outliers using z-score
export function findOutliers(data: DataRow[], column: string, threshold = 3): DataRow[] {
  const values = data.map(row => Number(row[column])).filter(v => !isNaN(v));
  
  if (values.length === 0) return [];
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
  
  if (stdDev === 0) return [];
  
  return data.filter(row => {
    const value = Number(row[column]);
    if (isNaN(value)) return false;
    return Math.abs((value - mean) / stdDev) > threshold;
  });
}

// Generate AI insights
export function generateInsights(data: DataRow[]): DataInsight[] {
  const insights: DataInsight[] = [];
  const columns = analyzeData(data);
  const numericColumns = columns.filter(col => col.type === 'numeric');
  const categoricalColumns = columns.filter(col => col.type === 'categorical');
  
  // Find correlations
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i].name;
      const col2 = numericColumns[j].name;
      const correlation = calculateCorrelation(data, col1, col2);
      
      if (Math.abs(correlation) > 0.5) {
        insights.push({
          title: `Strong ${correlation > 0 ? 'positive' : 'negative'} correlation found`,
          description: `${col1} and ${col2} show a ${correlation > 0 ? 'positive' : 'negative'} correlation (r ≈ ${correlation.toFixed(2)})`,
          confidence: Math.abs(correlation),
          type: 'correlation'
        });
      }
    }
  }
  
  // Find outliers
  numericColumns.forEach(col => {
    const outliers = findOutliers(data, col.name);
    if (outliers.length > 0 && outliers.length < data.length * 0.1) {
      insights.push({
        title: `Outliers detected in ${col.name}`,
        description: `Found ${outliers.length} potential outliers in ${col.name} column`,
        confidence: 0.8,
        type: 'outlier'
      });
    }
  });
  
  // Categorical analysis
  categoricalColumns.forEach(col => {
    if (col.values.length > 1 && col.values.length < 20) {
      const counts = col.values.reduce((acc, val) => {
        const key = String(val);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const countValues = Object.values(counts) as number[];
      const maxCount = countValues.length > 0 ? Math.max(...countValues) : 0;
      const maxCategory = Object.keys(counts).find(key => counts[key] === maxCount);
      
      if (maxCategory && maxCount > data.length * 0.4) {
        insights.push({
          title: `Dominant category in ${col.name}`,
          description: `${maxCategory} represents ${((maxCount / data.length) * 100).toFixed(1)}% of all ${col.name} values`,
          confidence: 0.7,
          type: 'categorical'
        });
      }
    }
  });
  
  return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

// Apply filters to data
export function applyFilters(data: DataRow[], filters: FilterRule[]): DataRow[] {
  return data.filter(row => {
    return filters.every(filter => {
      if (!filter.enabled) return true;
      
      const value = row[filter.column];
      
      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'greater':
          return Number(value) > Number(filter.value);
        case 'less':
          return Number(value) < Number(filter.value);
        case 'range':
          const [min, max] = filter.value;
          return Number(value) >= min && Number(value) <= max;
        default:
          return true;
      }
    });
  });
}

// Group and aggregate data
export function groupAndAggregate(
  data: DataRow[],
  groupColumns: string[],
  aggregations: { column: string; function: 'sum' | 'avg' | 'count' | 'min' | 'max' }[]
): DataRow[] {
  const groups = new Map<string, DataRow[]>();
  
  data.forEach(row => {
    const key = groupColumns.map(col => row[col]).join('|');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  });
  
  return Array.from(groups.entries()).map(([key, groupData]) => {
    const result: DataRow = {};
    
    // Add group columns
    groupColumns.forEach((col, index) => {
      result[col] = key.split('|')[index];
    });
    
    // Add aggregations
    aggregations.forEach(agg => {
      const values = groupData.map(row => Number(row[agg.column])).filter(v => !isNaN(v));
      
      switch (agg.function) {
        case 'sum':
          result[`${agg.column}_sum`] = values.reduce((sum, v) => sum + v, 0);
          break;
        case 'avg':
          result[`${agg.column}_avg`] = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
          break;
        case 'count':
          result[`${agg.column}_count`] = values.length;
          break;
        case 'min':
          result[`${agg.column}_min`] = Math.min(...values);
          break;
        case 'max':
          result[`${agg.column}_max`] = Math.max(...values);
          break;
      }
    });
    
    return result;
  });
}

// Add computed fields
export function addComputedFields(data: DataRow[], computedFields: ComputedField[]): DataRow[] {
  return data.map(row => {
    const newRow = { ...row };
    
    computedFields.forEach(field => {
      try {
        // Simple expression evaluation (you may want to use a proper expression parser)
        const expression = field.expression
          .replace(/\b(\w+)\b/g, (match) => {
            return row[match] !== undefined ? String(row[match]) : match;
          });
        
        // eslint-disable-next-line no-eval
        newRow[field.name] = eval(expression);
      } catch (error) {
        newRow[field.name] = null;
      }
    });
    
    return newRow;
  });
}