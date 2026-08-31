import { ColumnMeta, ColumnType, DatasetProfile, DescriptiveStatRow, CategoricalStatRow } from '../types';

export function isNumeric(val: any): boolean {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  return !isNaN(num) && typeof val !== 'boolean';
}

export function isBoolean(val: any): boolean {
  if (typeof val === 'boolean') return true;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    return ['true', 'false', 'yes', 'no', 't', 'f', '1', '0'].includes(lower);
  }
  return false;
}

export function isDateLike(val: any): boolean {
  if (val instanceof Date) return !isNaN(val.getTime());
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.length < 4 || isNumeric(trimmed)) return false;
  const parsed = Date.parse(trimmed);
  if (isNaN(parsed)) return false;
  // Match common date patterns: YYYY-MM-DD, MM/DD/YYYY, etc.
  return /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(trimmed) ||
         /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(trimmed) ||
         /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/.test(trimmed);
}

export function detectColumnType(values: any[]): ColumnType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'unknown';

  let numericCount = 0;
  let dateCount = 0;
  let boolCount = 0;

  for (const v of nonNull) {
    if (isNumeric(v)) numericCount++;
    else if (isDateLike(v)) dateCount++;
    else if (isBoolean(v)) boolCount++;
  }

  const threshold = 0.7;
  const total = nonNull.length;

  if (numericCount / total >= threshold) return 'numeric';
  if (dateCount / total >= threshold) return 'datetime';
  if (boolCount / total >= threshold) return 'boolean';

  return 'categorical';
}

export function profileDataset(data: Record<string, any>[]): DatasetProfile {
  if (!data || data.length === 0) {
    return {
      rows: 0,
      columns: 0,
      columnMetas: [],
      numericColumns: [],
      categoricalColumns: [],
      datetimeColumns: [],
      booleanColumns: [],
      totalMissing: 0,
      missingPercentage: 0,
      duplicateRows: 0,
      memoryEstimateKb: 0,
    };
  }

  const rows = data.length;
  const columnNames = Object.keys(data[0] || {});
  const columns = columnNames.length;

  let totalMissing = 0;
  const columnMetas: ColumnMeta[] = [];
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];
  const datetimeColumns: string[] = [];
  const booleanColumns: string[] = [];

  for (const col of columnNames) {
    const rawValues = data.map((d) => d[col]);
    let missingCount = 0;
    const uniqueSet = new Set<string>();

    for (const val of rawValues) {
      if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
        missingCount++;
        totalMissing++;
      } else {
        uniqueSet.add(String(val));
      }
    }

    const type = detectColumnType(rawValues);
    if (type === 'numeric') numericColumns.push(col);
    else if (type === 'datetime') datetimeColumns.push(col);
    else if (type === 'boolean') booleanColumns.push(col);
    else categoricalColumns.push(col);

    const sampleValues = rawValues
      .filter((v) => v !== null && v !== undefined && v !== '')
      .slice(0, 5);

    columnMetas.push({
      name: col,
      type,
      rawType: typeof rawValues.find((v) => v !== null && v !== undefined),
      uniqueCount: uniqueSet.size,
      missingCount,
      missingPercentage: (missingCount / rows) * 100,
      sampleValues,
    });
  }

  // Count duplicate rows
  const rowStrings = new Set<string>();
  let duplicateRows = 0;
  for (const row of data) {
    const str = JSON.stringify(row);
    if (rowStrings.has(str)) {
      duplicateRows++;
    } else {
      rowStrings.add(str);
    }
  }

  const missingPercentage = rows * columns > 0 ? (totalMissing / (rows * columns)) * 100 : 0;
  const memoryEstimateKb = Math.round((JSON.stringify(data).length * 2) / 1024);

  return {
    rows,
    columns,
    columnMetas,
    numericColumns,
    categoricalColumns,
    datetimeColumns,
    booleanColumns,
    totalMissing,
    missingPercentage,
    duplicateRows,
    memoryEstimateKb,
  };
}

export function computeDescriptiveStatistics(
  data: Record<string, any>[],
  numericColumns: string[]
): DescriptiveStatRow[] {
  const results: DescriptiveStatRow[] = [];

  for (const col of numericColumns) {
    const validNums = data
      .map((d) => (isNumeric(d[col]) ? Number(d[col]) : null))
      .filter((n): n is number => n !== null && !isNaN(n));

    if (validNums.length === 0) {
      results.push({
        feature: col,
        count: 0,
        mean: null,
        std: null,
        min: null,
        q25: null,
        median: null,
        q75: null,
        max: null,
        iqr: null,
        skewness: null,
        kurtosis: null,
      });
      continue;
    }

    const count = validNums.length;
    const sorted = [...validNums].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const mean = sum / count;

    // Variance & Std
    const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (count > 1 ? count - 1 : 1);
    const std = Math.sqrt(variance);

    // Quantiles
    const min = sorted[0];
    const max = sorted[count - 1];

    const getPercentile = (p: number) => {
      const index = (count - 1) * p;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    const q25 = getPercentile(0.25);
    const median = getPercentile(0.5);
    const q75 = getPercentile(0.75);
    const iqr = q75 - q25;

    // Skewness
    let m3 = 0;
    let m4 = 0;
    for (const v of sorted) {
      const diff = v - mean;
      m3 += Math.pow(diff, 3);
      m4 += Math.pow(diff, 4);
    }
    m3 /= count;
    m4 /= count;

    const skewness = std > 0 ? m3 / Math.pow(std, 3) : 0;
    const kurtosis = std > 0 ? m4 / Math.pow(std, 4) - 3 : 0;

    results.push({
      feature: col,
      count,
      mean: Number(mean.toFixed(2)),
      std: Number(std.toFixed(2)),
      min: Number(min.toFixed(2)),
      q25: Number(q25.toFixed(2)),
      median: Number(median.toFixed(2)),
      q75: Number(q75.toFixed(2)),
      max: Number(max.toFixed(2)),
      iqr: Number(iqr.toFixed(2)),
      skewness: Number(skewness.toFixed(3)),
      kurtosis: Number(kurtosis.toFixed(3)),
    });
  }

  return results;
}

export function computeCategoricalSummary(
  data: Record<string, any>[],
  categoricalColumns: string[]
): CategoricalStatRow[] {
  const results: CategoricalStatRow[] = [];
  const totalRows = data.length;

  for (const col of categoricalColumns) {
    const freqMap = new Map<string, number>();
    for (const row of data) {
      const val = row[col];
      if (val !== null && val !== undefined && val !== '') {
        const str = String(val);
        freqMap.set(str, (freqMap.get(str) || 0) + 1);
      }
    }

    let topCategory = '—';
    let topFrequency = 0;

    for (const [category, count] of freqMap.entries()) {
      if (count > topFrequency) {
        topFrequency = count;
        topCategory = category;
      }
    }

    const uniqueCount = freqMap.size;
    const topPercentage = totalRows > 0 ? (topFrequency / totalRows) * 100 : 0;
    const cardinalityLevel: 'Low' | 'Medium' | 'High' =
      uniqueCount <= 10 ? 'Low' : uniqueCount <= 50 ? 'Medium' : 'High';

    results.push({
      feature: col,
      uniqueCount,
      topCategory,
      topFrequency,
      topPercentage: Number(topPercentage.toFixed(1)),
      cardinalityLevel,
    });
  }

  return results;
}

export function computeCorrelationMatrix(
  data: Record<string, any>[],
  numericColumns: string[]
): { columns: string[]; matrix: number[][] } {
  const matrix: number[][] = [];
  const validCols = numericColumns.filter((col) => {
    const nums = data.map((d) => Number(d[col])).filter((n) => !isNaN(n));
    return nums.length > 1;
  });

  for (let i = 0; i < validCols.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < validCols.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
        continue;
      }

      const colA = validCols[i];
      const colB = validCols[j];

      let sumA = 0;
      let sumB = 0;
      let count = 0;
      const pairs: [number, number][] = [];

      for (const row of data) {
        const valA = Number(row[colA]);
        const valB = Number(row[colB]);
        if (!isNaN(valA) && !isNaN(valB)) {
          pairs.push([valA, valB]);
          sumA += valA;
          sumB += valB;
          count++;
        }
      }

      if (count < 2) {
        matrix[i][j] = 0;
        continue;
      }

      const meanA = sumA / count;
      const meanB = sumB / count;

      let num = 0;
      let denA = 0;
      let denB = 0;

      for (const [a, b] of pairs) {
        const diffA = a - meanA;
        const diffB = b - meanB;
        num += diffA * diffB;
        denA += diffA * diffA;
        denB += diffB * diffB;
      }

      const denom = Math.sqrt(denA * denB);
      matrix[i][j] = denom > 0 ? Number((num / denom).toFixed(3)) : 0;
    }
  }

  return { columns: validCols, matrix };
}
