export type ActiveTab =
  | 'overview'
  | 'statistics'
  | 'cleaning'
  | 'charts'
  | 'ml'
  | 'forecasting'
  | 'decision'
  | 'voice'
  | 'chat'
  | 'insights'
  | 'report'
  | 'export';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedActions?: { label: string; tab?: ActiveTab; prompt?: string }[];
  isStreaming?: boolean;
}

export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'unknown';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  rawType: string;
  uniqueCount: number;
  missingCount: number;
  missingPercentage: number;
  sampleValues: (string | number | boolean | null)[];
}

export interface DatasetProfile {
  rows: number;
  columns: number;
  columnMetas: ColumnMeta[];
  numericColumns: string[];
  categoricalColumns: string[];
  datetimeColumns: string[];
  booleanColumns: string[];
  totalMissing: number;
  missingPercentage: number;
  duplicateRows: number;
  memoryEstimateKb: number;
}

export interface DescriptiveStatRow {
  feature: string;
  count: number;
  mean: number | null;
  std: number | null;
  min: number | null;
  q25: number | null;
  median: number | null;
  q75: number | null;
  max: number | null;
  iqr: number | null;
  skewness: number | null;
  kurtosis: number | null;
}

export interface CategoricalStatRow {
  feature: string;
  uniqueCount: number;
  topCategory: string;
  topFrequency: number;
  topPercentage: number;
  cardinalityLevel: 'Low' | 'Medium' | 'High';
}

export interface ChartRecommendation {
  id: string;
  type: 'line' | 'bar' | 'scatter' | 'histogram' | 'count';
  title: string;
  xAxis: string;
  yAxis?: string;
  reason: string;
}

export type ProblemType = 'classification' | 'regression';

export interface ModelScore {
  modelName: string;
  problemType: ProblemType;
  primaryMetricName: string;
  primaryMetricScore: number;
  metrics: Record<string, number>;
  trainingTimeMs: number;
}

export interface PredictionRow {
  index: number;
  actual: string | number;
  predicted: string | number;
  confidence?: number;
  isCorrect?: boolean;
}

export interface DecisionTreeNode {
  id: string;
  feature?: string;
  threshold?: number;
  gain?: number;
  prediction?: string | number;
  samples: number;
  valueDistribution?: Record<string, number>;
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  normalizedImportance: number;
}

export interface MLResult {
  targetColumn: string;
  problemType: ProblemType;
  featureNames: string[];
  trainedModels: Record<string, any>;
  comparison: ModelScore[];
  bestModelName: string;
  bestModelScore: number;
  testPredictions: PredictionRow[];
  treeNode?: DecisionTreeNode;
  featureImportances: FeatureImportance[];
  confusionMatrix?: {
    labels: string[];
    matrix: number[][];
  };
}

export interface ForecastPoint {
  year: number | string;
  forecast: number;
  lowerBound: number;
  upperBound: number;
  isHistorical?: boolean;
}

export interface ForecastResult {
  dateColumn: string;
  targetColumn: string;
  yearsAhead: number;
  trend: 'Strong Growth' | 'Moderate Growth' | 'Stable / Flat' | 'Declining' | 'Volatile';
  historicalGrowthRate: number;
  compoundAnnualGrowthRate: number;
  rSquared: number;
  recommendation: string;
  forecasts: ForecastPoint[];
  historicalPoints: { time: string | number; value: number }[];
}

export interface DecisionResult {
  decision: 'PROCEED & EXPAND' | 'PROCEED WITH CAUTION' | 'HOLD / MONITOR' | 'MITIGATE RISK';
  risk: 'Low' | 'Moderate' | 'High' | 'Severe';
  score: number;
  confidence: number;
  recommendation: string;
  forecastDirection: string;
  businessQuestion: string;
  dateColumn: string;
  targetColumn: string;
  auditMetrics: {
    dataVolumeScore: number;
    growthSignalScore: number;
    trendStabilityScore: number;
    dataQualityScore: number;
    varianceScore: number;
  };
  generatedAt: string;
}

export interface InsightItem {
  category: 'quality' | 'feature' | 'business';
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  description: string;
}

export interface InsightSummary {
  overviewText: string;
  qualityInsights: InsightItem[];
  featureInsights: InsightItem[];
  businessInsights: InsightItem[];
}

// ---------------------------------------------------------------------------
// FRONTEND 2: Autonomous Neural Training & Future Forecasting Engine Types
// ---------------------------------------------------------------------------

export type AppFrontendMode = 'frontend-1-analytics' | 'frontend-2-deep-forecasting';

export interface ContainerStoredFile {
  id: string;
  filename: string;
  fileType: 'csv' | 'json' | 'excel';
  sizeBytes: number;
  rowCount: number;
  columnCount: number;
  uploadedAt: string;
  containerPath: string;
  status: 'ready' | 'training' | 'trained';
  previewData: Record<string, any>[];
  columns: string[];
  numericColumns: string[];
  inferredFrequency: string;
  checksum: string;
}

export type NeuralArchitecture =
  | 'transformer_tst'
  | 'deep_lstm_gru'
  | 'mamba_ssm'
  | 'neural_ensemble';

export interface NeuralModelConfig {
  modelArchitecture: NeuralArchitecture;
  horizon: number;
  contextWindow: number;
  hiddenDimension: number;
  attentionHeads: number;
  epochs: number;
  batchSize: number;
  learningRate: number;
  quantization: 'FP16' | 'BF16' | 'INT8' | 'FP8';
  targetSignal: string;
  dropout: number;
}

export interface EpochTrainingLog {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  learningRate: number;
  batchThroughput: number;
  kvCacheUtilPercent: number;
  vramAllocatedMb: number;
}

export interface FutureForecastPoint {
  step: number;
  label: string;
  forecast: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
  optimistic: number;
  pessimistic: number;
  shockScenario: number;
}

export interface DeepForecastResult {
  modelArchitecture: string;
  modelArchitectureLabel: string;
  horizon: number;
  targetSignal: string;
  totalDataPoints: number;
  forecastPoints: FutureForecastPoint[];
  monteCarloPaths: number[][];
  metrics: {
    mape: number;
    rmse: number;
    mae: number;
    rSquared: number;
    directionalAccuracy: number;
    tStatistic: number;
    pValue: number;
    nullHypothesisRejected: boolean;
    fStatistic?: number;
    chiSquareScore?: number;
  };
  hardwareTelemetry: {
    avgInferenceLatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    peakVramMb: number;
    peakKvCachePercent: number;
    throughputSamplesSec: number;
    precision: string;
    devicePlacement: string;
    vllmPagedAttentionEnabled: boolean;
  };
  trainingLogs: EpochTrainingLog[];
  trendNarrative: string;
  generatedAt: string;
}
