import { InsightSummary, InsightItem } from '../types';
import { profileDataset } from './analysis';

export function generateDatasetInsights(data: Record<string, any>[]): InsightSummary {
  const profile = profileDataset(data);
  const { rows, columns, totalMissing, missingPercentage, duplicateRows, numericColumns, categoricalColumns, datetimeColumns } = profile;

  const qualityInsights: InsightItem[] = [];
  const featureInsights: InsightItem[] = [];
  const businessInsights: InsightItem[] = [];

  // --- Quality Insights ---
  if (totalMissing === 0) {
    qualityInsights.push({
      category: 'quality',
      severity: 'success',
      title: 'Complete Data Integrity',
      description: 'Zero missing values detected across all observations and features.',
    });
  } else {
    qualityInsights.push({
      category: 'quality',
      severity: missingPercentage > 10 ? 'critical' : 'warning',
      title: `${totalMissing} Missing Values Identified (${missingPercentage.toFixed(1)}%)`,
      description: 'Applying missing-value imputation or column pruning before modeling is recommended.',
    });
  }

  if (duplicateRows === 0) {
    qualityInsights.push({
      category: 'quality',
      severity: 'success',
      title: 'Zero Duplicate Records',
      description: 'All rows represent unique, distinct observations.',
    });
  } else {
    qualityInsights.push({
      category: 'quality',
      severity: 'warning',
      title: `${duplicateRows} Duplicate Rows Found`,
      description: 'Deduplicating the dataset will eliminate redundant weighting in statistical summaries.',
    });
  }

  // --- Feature Insights ---
  featureInsights.push({
    category: 'feature',
    severity: 'info',
    title: `${numericColumns.length} Numeric & ${categoricalColumns.length} Categorical Signals`,
    description: `Dataset contains a ${
      numericColumns.length > categoricalColumns.length
        ? 'predominantly quantitative'
        : categoricalColumns.length > numericColumns.length
        ? 'predominantly categorical'
        : 'balanced'
    } composition of feature dimensions.`,
  });

  if (datetimeColumns.length > 0) {
    featureInsights.push({
      category: 'feature',
      severity: 'success',
      title: `Time-Series Ready (${datetimeColumns.join(', ')})`,
      description: 'Temporal dimensions detected, enabling forward forecasting and longitudinal trend tracking.',
    });
  } else {
    featureInsights.push({
      category: 'feature',
      severity: 'info',
      title: 'Cross-Sectional Structure',
      description: 'No primary date/time columns detected; suitable for static classification and regression.',
    });
  }

  // --- Business Insights ---
  if (rows >= 100) {
    businessInsights.push({
      category: 'business',
      severity: 'success',
      title: 'Statistical Sample Adequacy',
      description: `With ${rows.toLocaleString()} records, statistical power is sufficient for reliable predictive modeling.`,
    });
  } else {
    businessInsights.push({
      category: 'business',
      severity: 'info',
      title: 'Compact Sample Volume',
      description: `Dataset contains ${rows} observations; cross-validation and regularized estimators are advised.`,
    });
  }

  if (numericColumns.length >= 2) {
    businessInsights.push({
      category: 'business',
      severity: 'success',
      title: 'Multivariate Relationship Depth',
      description: 'Multiple quantitative measures allow correlation analysis, regression fitting, and scatter clustering.',
    });
  }

  return {
    overviewText: `Active dataset contains ${rows.toLocaleString()} records across ${columns} dimensions with an estimated in-memory footprint of ${profile.memoryEstimateKb} KB.`,
    qualityInsights,
    featureInsights,
    businessInsights,
  };
}
