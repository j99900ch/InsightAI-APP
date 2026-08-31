import { DatasetProfile, MLResult, ForecastResult, DecisionResult } from '../types';

export interface ChatContext {
  data: Record<string, any>[];
  profile: DatasetProfile;
  datasetName: string;
  mlResult?: MLResult | null;
  forecastResult?: ForecastResult | null;
  decisionResult?: DecisionResult | null;
}

export function generateHeuristicAgentResponse(
  userQuery: string,
  ctx: ChatContext
): { text: string; actions?: { label: string; tab?: any; prompt?: string }[] } {
  const query = userQuery.toLowerCase();
  const { profile, datasetName, mlResult, forecastResult, decisionResult } = ctx;

  // 1. Overview / Summary / Executive Brief
  if (
    query.includes('summary') ||
    query.includes('overview') ||
    query.includes('brief') ||
    query.includes('explain dataset') ||
    query.includes('what is this data')
  ) {
    const numCols = profile.numericColumns.join(', ') || 'None';
    const catCols = profile.categoricalColumns.join(', ') || 'None';
    const missingNotice =
      profile.totalMissing > 0
        ? `⚠️ **Data Quality Note:** There are **${profile.totalMissing.toLocaleString()} missing cells** (${profile.missingPercentage.toFixed(1)}% of total entries).`
        : `✅ **Data Quality:** Dataset is **100% complete** with zero missing cells.`;

    const text = `### 📊 Executive Dataset Summary for **${datasetName}**

- **Dataset Scale**: **${profile.rows.toLocaleString()} rows** across **${profile.columns} columns**
- **Numeric Features (${profile.numericColumns.length})**: \`${numCols}\`
- **Categorical Dimensions (${profile.categoricalColumns.length})**: \`${catCols}\`
- **Estimated In-Memory Footprint**: ~${profile.memoryEstimateKb.toFixed(1)} KB
- ${missingNotice}

#### 💡 Strategic Takeaway:
This dataset is primed for **multivariate exploratory analysis** and **automated predictive modeling**. 
${profile.numericColumns.length >= 2 ? `You have **${profile.numericColumns.length} numerical metrics** suitable for correlation and regression benchmarking.` : ''}
${profile.categoricalColumns.length > 0 ? `Categorical dimensions provide segmentation slices for cross-tabulated profiling.` : ''}`;

    return {
      text,
      actions: [
        { label: '📈 View Descriptive Statistics', tab: 'statistics' },
        { label: '📊 Open Visualization Studio', tab: 'charts' },
        { label: '🤖 Train ML Models', tab: 'ml' },
      ],
    };
  }

  // 2. Correlation / Relationships
  if (query.includes('correlation') || query.includes('relationship') || query.includes('correlate')) {
    if (profile.numericColumns.length < 2) {
      return {
        text: `At least 2 numeric columns are required to evaluate pairwise correlation. Current dataset has: \`${profile.numericColumns.join(', ') || 'None'}\`.`,
      };
    }

    const colA = profile.numericColumns[0];
    const colB = profile.numericColumns[1];

    return {
      text: `### 🔗 Correlation & Feature Relationship Analysis

Pairwise mathematical relationships reveal how metrics co-vary across your **${profile.rows} records**:

- **Key Numerical Dimensions**: \`${profile.numericColumns.slice(0, 4).join('`, `')}\`
- **Top Pair Candidate**: \`${colA}\` vs \`${colB}\`
- **Recommendation**: Linear correlation coefficients (*Pearson r*) measure direct proportionality, while scatter plots reveal nonlinear clusters and outlier variances.

Head over to the **Visualization Studio** to inspect the interactive Correlation Matrix heatmap and OLS regression scatter plots!`,
      actions: [
        { label: '🔍 Open Correlation Matrix', tab: 'charts' },
        { label: '🤖 Test Feature Importance in ML', tab: 'ml' },
      ],
    };
  }

  // 3. Machine Learning / Prediction / Model Selection
  if (
    query.includes('ml') ||
    query.includes('model') ||
    query.includes('predict') ||
    query.includes('classification') ||
    query.includes('regression') ||
    query.includes('algorithm')
  ) {
    if (mlResult) {
      const modelScores = mlResult.comparison
        .map((m) => `${m.modelName} (${(m.primaryMetricScore * 100).toFixed(1)}%)`)
        .join(', ');

      return {
        text: `### 🤖 Active Machine Learning Benchmark Status

- **Target Variable**: \`${mlResult.targetColumn}\` (${mlResult.problemType.toUpperCase()})
- **Top Performing Model**: **${mlResult.bestModelName}** with score **${(mlResult.bestModelScore * 100).toFixed(1)}%**
- **Evaluated Models**: ${modelScores}
- **Top Influential Feature**: \`${mlResult.featureImportances[0]?.feature || 'N/A'}\`

#### 🎯 Strategic Recommendation:
The **${mlResult.bestModelName}** offers the highest cross-validation stability on this dataset. You can simulate what-if scenarios directly in the ML Studio.`,
        actions: [
          { label: '🚀 Open Machine Learning Studio', tab: 'ml' },
          { label: '📑 Generate Full PDF Report', tab: 'report' },
        ],
      };
    }

    const suggestedTarget =
      profile.categoricalColumns[0] || profile.numericColumns[profile.numericColumns.length - 1] || 'Target';
    const candidateFeatures = profile.columnMetas.map((c) => c.name).slice(0, 5).join('`, `');

    return {
      text: `### 🤖 Automated ML Workflow Recommendation

For **${datasetName}**, we can train both **Classification** (predicting categorical labels) and **Regression** (predicting continuous numerical quantities).

- **Suggested Target Variable**: \`${suggestedTarget}\`
- **Available Feature Candidates**: \`${candidateFeatures}\`
- **Evaluated Ensemble Algorithms**: Random Forest, Gradient Boosted Trees, Logistic/Ridge Regression, and Explainable Decision Trees.

Would you like to initiate the Automated ML model benchmark?`,
      actions: [{ label: '⚡ Run AutoML Benchmark Now', tab: 'ml' }],
    };
  }

  // 4. Data Cleaning / Missing Values
  if (
    query.includes('clean') ||
    query.includes('missing') ||
    query.includes('null') ||
    query.includes('outlier') ||
    query.includes('quality')
  ) {
    const missingMetas = profile.columnMetas.filter((c) => c.missingCount > 0);
    if (missingMetas.length === 0) {
      return {
        text: `### 🛡️ Data Quality & Hygiene Report

- **Completeness**: **100% Clean** (0 missing cells detected across all ${profile.columns} columns)
- **Duplicate Rows**: **${profile.duplicateRows} duplicates**
- **Readiness Score**: **100 / 100**

Your dataset has zero missing values and is directly optimized for high-precision inference and reporting!`,
        actions: [{ label: '📊 Explore Visualizations', tab: 'charts' }],
      };
    }

    const missingLines = missingMetas
      .map(
        (m) =>
          `  - \`${m.name}\`: **${m.missingCount} missing** (${m.missingPercentage.toFixed(1)}%) — *Type: ${m.type}*`
      )
      .join('\n');

    return {
      text: `### 🧹 Data Cleaning Audit for **${datasetName}**

- **Total Missing Cells**: **${profile.totalMissing.toLocaleString()}** (${profile.missingPercentage.toFixed(1)}% of all entries)
- **Columns Needing Imputation**:
${missingLines}

#### 💡 Recommended Next Actions:
1. **Numerical Imputation**: Impute numerical columns using **Median** (robust against skew) or **Mean**.
2. **Categorical Imputation**: Fill missing text values with **Mode (Most Frequent)** or a placeholder token.
3. Apply transformations in the **Data Cleaning Studio** with 1-click execution.`,
      actions: [
        { label: '✨ Go to Data Cleaning Studio', tab: 'cleaning' },
        { label: '📊 View Column Distributions', tab: 'statistics' },
      ],
    };
  }

  // 5. Forecasting & Trends
  if (
    query.includes('forecast') ||
    query.includes('trend') ||
    query.includes('future') ||
    query.includes('growth') ||
    query.includes('time series')
  ) {
    if (forecastResult) {
      return {
        text: `### 🔮 Time-Series Trend Forecast Status

- **Timeline Column**: \`${forecastResult.dateColumn}\` → Target: \`${forecastResult.targetColumn}\`
- **Empirical Trend**: **${forecastResult.trend}** (CAGR: **${forecastResult.compoundAnnualGrowthRate.toFixed(1)}%**)
- **Regression Fit Quality (R²)**: **${(forecastResult.rSquared * 100).toFixed(1)}%**
- **Horizon**: **${forecastResult.yearsAhead} periods forward**

#### 📋 Strategic Directive:
${forecastResult.recommendation}`,
        actions: [
          { label: '📈 Inspect Forecast Bounds', tab: 'forecasting' },
          { label: '⚖️ Run Strategic Decision Engine', tab: 'decision' },
        ],
      };
    }

    return {
      text: `### 📈 Time-Series Projection & Growth Forecasting

Our projection engine calculates **Compound Annual Growth Rate (CAGR)**, linear and quadratic polynomial trendlines, and computes **95% empirical confidence intervals** for future horizons.

- **Available Metrics for Forecasting**: \`${profile.numericColumns.join('`, `') || 'None'}\`
- **Date/Time Dimension**: \`${profile.datetimeColumns[0] || 'Index Sequence'}\`

Head to the **Trend Forecasting** studio to simulate forward trajectories!`,
      actions: [{ label: '🔮 Open Trend Forecasting', tab: 'forecasting' }],
    };
  }

  // 6. Decision Engine & Risk Assessment
  if (
    query.includes('decision') ||
    query.includes('risk') ||
    query.includes('recommendation') ||
    query.includes('strategy') ||
    query.includes('action')
  ) {
    if (decisionResult) {
      return {
        text: `### ⚖️ Strategic Decision Intelligence Audit

- **Core Recommendation**: **${decisionResult.decision}**
- **Risk Profile**: **${decisionResult.risk} Risk** (Confidence: **${decisionResult.confidence}%**)
- **Composite Viability Score**: **${decisionResult.score} / 100**
- **Business Directive**:
  > "${decisionResult.recommendation}"

#### 🔬 Factor Breakdown:
- Growth Signal: **${decisionResult.auditMetrics.growthSignalScore} / 25**
- Data Quality: **${decisionResult.auditMetrics.dataQualityScore} / 20**
- Trend Stability: **${decisionResult.auditMetrics.trendStabilityScore} / 20**`,
        actions: [
          { label: '🎯 Open Decision Intelligence View', tab: 'decision' },
          { label: '🎙️ Test Voice Decision Assistant', tab: 'voice' },
        ],
      };
    }

    return {
      text: `### ⚖️ Multi-Factor Decision Intelligence

Our Decision Engine evaluates risk and viability across 5 mathematical criteria:
1. **Growth Momentum & CAGR trajectory**
2. **Signal Variance & Volatility**
3. **Data Completeness & Sample Size Confidence**
4. **Historical Stability (R² fit)**
5. **Downside Risk Buffer**

You can run automated decision scoring or query with spoken voice commands in the Decision Engine.`,
      actions: [
        { label: '🎯 Run Decision Engine', tab: 'decision' },
        { label: '🎙️ Speak with Voice Assistant', tab: 'voice' },
      ],
    };
  }

  // 7. General / Conversational Response
  return {
    text: `### 🧠 InsightAI Real-Time Agent Analysis

Based on your current dataset **${datasetName}** (${profile.rows.toLocaleString()} rows, ${profile.columns} columns):

- **Primary Metrics**: \`${profile.numericColumns.slice(0, 4).join('`, `') || 'N/A'}\`
- **Key Categories**: \`${profile.categoricalColumns.slice(0, 3).join('`, `') || 'None'}\`
- **Data Completeness**: **${(100 - profile.missingPercentage).toFixed(1)}% complete**

#### How would you like to proceed?
- Ask me specific questions about column distributions, trends, or anomalies.
- Request an automated Machine Learning pipeline or feature ranking.
- Ask for SQL / Python analytics snippets for this schema.`,
    actions: [
      { label: '📊 Dataset Summary', prompt: 'Give me an executive summary of this dataset' },
      { label: '🤖 Recommend ML Target', prompt: 'What target should I predict with machine learning?' },
      { label: '🧹 Check Data Quality', prompt: 'Check data quality and missing values' },
      { label: '🔮 Forecast Growth', prompt: 'Forecast future growth and trend trajectories' },
    ],
  };
}
