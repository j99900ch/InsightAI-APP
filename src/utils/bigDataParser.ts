import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ContainerStoredFile } from '../types';

/**
 * Parses uploaded document (JSON, Excel, or CSV) in any format and schema.
 * Handles unlabelled data and extracts numeric columns, sample rows, and raw series.
 */
export async function parseUploadedDocument(
  file: File
): Promise<{
  filename: string;
  fileType: 'csv' | 'json' | 'excel';
  sizeBytes: number;
  rowCount: number;
  columnCount: number;
  columns: string[];
  numericColumns: string[];
  previewData: Record<string, any>[];
  allData: Record<string, any>[];
  rawContentString: string;
}> {
  const filename = file.name;
  const sizeBytes = file.size;
  const lowerName = filename.toLowerCase();

  let fileType: 'csv' | 'json' | 'excel' = 'csv';
  if (lowerName.endsWith('.json')) fileType = 'json';
  else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) fileType = 'excel';

  let allData: Record<string, any>[] = [];
  let rawContentString = '';

  if (fileType === 'json') {
    const text = await file.text();
    rawContentString = text;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
          allData = parsed;
        } else {
          // Array of raw primitives/numbers
          allData = parsed.map((val, idx) => ({ index: idx, value: val }));
        }
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Find first array property
        const arrayKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
        if (arrayKey) {
          allData = parsed[arrayKey].map((item: any, idx: number) =>
            typeof item === 'object' && item !== null ? item : { index: idx, value: item }
          );
        } else {
          allData = [parsed];
        }
      }
    } catch (e: any) {
      throw new Error(`Invalid JSON document: ${e.message}`);
    }
  } else if (fileType === 'excel') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    allData = XLSX.utils.sheet_to_json(sheet, { defval: null });
    rawContentString = `[Excel Binary Data: ${workbook.SheetNames.join(', ')} sheet]`;
  } else {
    // CSV
    const text = await file.text();
    rawContentString = text;
    const result = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    allData = result.data as Record<string, any>[];
  }

  if (!allData || allData.length === 0) {
    throw new Error('The uploaded document is empty or could not be parsed.');
  }

  // Extract columns
  const firstRow = allData[0] || {};
  const columns = Object.keys(firstRow);

  // Identify numeric columns in unlabelled data
  const numericColumns = columns.filter((col) => {
    let numericHits = 0;
    const testSample = allData.slice(0, Math.min(100, allData.length));
    for (const row of testSample) {
      const val = row[col];
      if (typeof val === 'number' && !isNaN(val)) numericHits++;
      else if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) numericHits++;
    }
    return numericHits >= testSample.length * 0.7;
  });

  return {
    filename,
    fileType,
    sizeBytes,
    rowCount: allData.length,
    columnCount: columns.length,
    columns,
    numericColumns: numericColumns.length > 0 ? numericColumns : columns,
    previewData: allData.slice(0, 25),
    allData,
    rawContentString: rawContentString.substring(0, 100000), // capped for container store
  };
}

/**
 * Generates enterprise-scale unlabelled datasets for instant big data testing.
 */
export function generateUnlabelledBigDataset(
  type: 'energy_telemetry' | 'high_frequency_finance' | 'iot_sensor_stream',
  rowCount: number = 10000
): { name: string; type: 'csv' | 'json' | 'excel'; data: Record<string, any>[] } {
  const data: Record<string, any>[] = [];

  if (type === 'energy_telemetry') {
    let loadKw = 450.0;
    const startTime = new Date(2025, 0, 1, 0, 0, 0).getTime();
    for (let i = 0; i < rowCount; i++) {
      const timeStr = new Date(startTime + i * 3600 * 1000).toISOString();
      const hourOfDay = (i % 24);
      const diurnal = Math.sin((hourOfDay / 24) * Math.PI * 2) * 80;
      const seasonal = Math.sin((i / (24 * 365)) * Math.PI * 2) * 45;
      const drift = (i / rowCount) * 60;
      const noise = (Math.random() - 0.5) * 20;
      loadKw = Math.max(50, Math.round((loadKw + diurnal * 0.05 + drift * 0.01 + noise) * 100) / 100);

      data.push({
        seq_id: i + 1,
        timestamp_utc: timeStr,
        grid_load_mw: Math.round((loadKw + diurnal + seasonal) * 100) / 100,
        voltage_phase_a: Math.round((230 + (Math.random() - 0.5) * 8) * 10) / 10,
        frequency_hz: Math.round((50.0 + (Math.random() - 0.5) * 0.15) * 1000) / 1000,
        reactive_power_mvar: Math.round((loadKw * 0.28 + (Math.random() - 0.5) * 10) * 100) / 100,
        ambient_temp_c: Math.round((18 + Math.sin(i * 0.1) * 10) * 10) / 10,
      });
    }
    return { name: `Grid_Telemetry_Unlabelled_${rowCount}_rows.csv`, type: 'csv', data };
  }

  if (type === 'high_frequency_finance') {
    let price = 64200.0;
    for (let i = 0; i < rowCount; i++) {
      const delta = (Math.random() - 0.495) * (price * 0.003);
      price = Math.max(100, Math.round((price + delta) * 100) / 100);
      data.push({
        tick_id: i + 1,
        bid_price: price,
        ask_price: Math.round((price + 0.5 + Math.random() * 2) * 100) / 100,
        order_volume: Math.round((1.2 + Math.random() * 15) * 100) / 100,
        vwap: Math.round((price * (1 + (Math.random() - 0.5) * 0.0008)) * 100) / 100,
        liquidity_depth_l1: Math.round(150000 + Math.random() * 80000),
      });
    }
    return { name: `OrderBook_Liquidity_Unlabelled_${rowCount}.json`, type: 'json', data };
  }

  // IoT Sensor
  let vibration = 0.45;
  for (let i = 0; i < rowCount; i++) {
    vibration = Math.max(0.01, Math.round((vibration + (Math.random() - 0.5) * 0.08) * 1000) / 1000);
    data.push({
      sensor_step: i + 1,
      vibration_rms: vibration,
      bearing_temperature: Math.round((65 + Math.sqrt(i) * 0.12 + Math.random() * 3) * 10) / 10,
      acoustic_emission_db: Math.round((42 + vibration * 20 + Math.random() * 4) * 10) / 10,
      oil_pressure_psi: Math.round((55 - (Math.random() - 0.5) * 3) * 10) / 10,
    });
  }
  return { name: `Turbine_Sensors_Unlabelled_${rowCount}.xlsx`, type: 'excel', data };
}
