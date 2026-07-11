'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Sun, Moon } from 'lucide-react';
import CsvUploader from '../components/CsvUploader';
import CsvPreviewTable from '../components/CsvPreviewTable';
import ConfirmImportBar from '../components/ConfirmImportBar';
import ResultsTable from '../components/ResultsTable';
import LoadingState from '../components/LoadingState';
import { parseCSV, ParsedCSV } from '../lib/csvParser';
import { importCSV } from '../lib/apiClient';
import { ImportResponse, SkippedRecord } from '../types/api';
import { CrmRecord } from '../types/crm';

const BATCH_SIZE = 30; // Batch size matching backend standard

type ErrorType = 'validation' | 'network' | 'server' | null;

interface ErrorDetails {
  type: ErrorType;
  message: string;
  actionableHint?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCSV | null>(null);
  const [originalHeaders, setOriginalHeaders] = useState<string[]>([]);
  
  // Progress states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [batchesDone, setBatchesDone] = useState<number>(0);
  const [batchesTotal, setBatchesTotal] = useState<number>(0);
  
  // Error categorization
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  
  // Final import results
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  // Dark Mode State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // F1 & F2: File Selected -> parse and preview
  const handleFileSelected = async (selectedFile: File) => {
    setIsLoading(true);
    setErrorDetails(null);
    setImportResult(null);
    try {
      const parsed = await parseCSV(selectedFile);
      setFile(selectedFile);
      setParsedCsv(parsed);
      setOriginalHeaders(parsed.headers);
    } catch (err: any) {
      setErrorDetails({
        type: 'validation',
        message: err.message || 'The selected file is empty or invalid.',
        actionableHint: 'Please upload a clean .csv text file under 10 MB.'
      });
      setFile(null);
      setParsedCsv(null);
    } finally {
      setIsLoading(false);
    }
  };

  // F3 & F10: Confirm trigger -> Send CSV chunks sequentially to show real-time progress
  const handleConfirmImport = async () => {
    if (!parsedCsv) return;
    
    setIsLoading(true);
    setErrorDetails(null);
    
    const rows = parsedCsv.rows;
    const headers = parsedCsv.headers;
    const totalRowsCount = rows.length;
    
    // Calculate batches
    const chunks: Record<string, string>[][] = [];
    for (let i = 0; i < totalRowsCount; i += BATCH_SIZE) {
      chunks.push(rows.slice(i, i + BATCH_SIZE));
    }
    
    const totalBatches = chunks.length;
    setBatchesTotal(totalBatches);
    setBatchesDone(0);

    const accumulatedParsed: CrmRecord[] = [];
    const accumulatedSkipped: SkippedRecord[] = [];

    // Process batches sequentially to respect Gemini API rate limits and update progress in real-time
    for (let index = 0; index < totalBatches; index++) {
      const chunkRows = chunks[index];
      const startRowIdx = index * BATCH_SIZE;

      try {
        // Convert chunk back into a mini-CSV file
        const csvContent = Papa.unparse({
          fields: headers,
          data: chunkRows
        });
        const chunkFile = new File([csvContent], `batch-${index + 1}.csv`, { type: 'text/csv' });

        // Call backend API with the single batch
        const response = await importCSV(chunkFile);
        
        accumulatedParsed.push(...response.parsed);
        
        // Re-align relative skipped row indices from backend chunk to absolute indices
        const realignedSkipped = response.skipped.map(s => ({
          ...s,
          rowIndex: startRowIdx + s.rowIndex
        }));
        accumulatedSkipped.push(...realignedSkipped);
        
      } catch (err: any) {
        // Categorize network vs server error
        const isNetwork = err.message.toLowerCase().includes('reach the server') || 
                          err.message.toLowerCase().includes('connection');
        
        const type: ErrorType = isNetwork ? 'network' : 'server';
        const message = err.message || 'An unexpected failure occurred during import.';
        const hint = isNetwork 
          ? 'Check that your backend server is running on http://localhost:5000 and has CORS properly configured.'
          : 'This can happen if your Gemini API quota is exceeded or the API key is invalid.';

        setErrorDetails({
          type,
          message: `Failed on batch ${index + 1} of ${totalBatches}: ${message}`,
          actionableHint: hint
        });

        // Fold remaining items in this batch as skipped due to failure
        chunkRows.forEach((row, i) => {
          accumulatedSkipped.push({
            rowIndex: startRowIdx + i,
            rowRawData: row,
            reason: `Batch processing network/server error: ${message}`
          });
        });
      }

      setBatchesDone(index + 1);
    }

    // Set combined result display
    setImportResult({
      parsed: accumulatedParsed,
      skipped: accumulatedSkipped,
      totalParsed: accumulatedParsed.length,
      totalSkipped: accumulatedSkipped.length
    });

    // Reset temporary staging states
    setParsedCsv(null);
    setFile(null);
    setIsLoading(false);
  };

  // Group 2: Retry failed rows in UI
  const handleRetrySkipped = (skipped: SkippedRecord[]) => {
    const retriableRows = skipped.map(s => s.rowRawData);
    
    // Re-stage skipped records as a new CSV preview
    setParsedCsv({
      headers: originalHeaders,
      rows: retriableRows,
      fileName: 'failed_rows_retry.csv',
      totalRows: retriableRows.length
    });
    
    // Reset output views to return to staging flow
    setImportResult(null);
    setErrorDetails(null);
    setBatchesDone(0);
    setBatchesTotal(0);
  };

  const handleReset = () => {
    setFile(null);
    setParsedCsv(null);
    setImportResult(null);
    setErrorDetails(null);
    setBatchesDone(0);
    setBatchesTotal(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 sticky top-0 z-20 backdrop-blur shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-900/10 dark:shadow-emerald-950/40">
              GE
            </div>
            <span className="font-semibold text-slate-800 dark:text-white tracking-tight">
              GrowEasy Importer
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-555 font-medium hidden sm:inline">CRM Importer v1.0</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Error notification banner with actionable hint */}
        {errorDetails && (
          <div className="mb-6 flex flex-col gap-1 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            <div className="flex items-start justify-between">
              <span className="font-semibold capitalize flex items-center gap-1.5">
                ⚠️ {errorDetails.type} Error
              </span>
              <button
                onClick={() => setErrorDetails(null)}
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-semibold focus:outline-none"
              >
                Dismiss
              </button>
            </div>
            <p className="mt-1 font-medium">{errorDetails.message}</p>
            {errorDetails.actionableHint && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-red-200 dark:border-red-500/10 pt-2 italic">
                Recommendation: {errorDetails.actionableHint}
              </p>
            )}
          </div>
        )}

        {/* State 1: Loading (AI Processing) with Batch Progress */}
        {isLoading && !parsedCsv ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 backdrop-blur-sm p-8 shadow-sm">
            <LoadingState batchesDone={batchesDone} totalBatches={batchesTotal} />
          </div>
        ) : importResult ? (
          /* State 2: Import Completed (Results display) */
          <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/20 p-8 shadow-md">
            <ResultsTable result={importResult} onReset={handleReset} onRetrySkipped={handleRetrySkipped} />
          </div>
        ) : parsedCsv ? (
          /* State 3: File Previewed (Raw preview table and confirmation trigger) */
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <button
                onClick={handleReset}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              >
                ← Change file
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 backdrop-blur-sm p-6 shadow-md">
              <CsvPreviewTable data={parsedCsv} />
              <ConfirmImportBar
                rowCount={parsedCsv.totalRows}
                onConfirm={handleConfirmImport}
                isLoading={isLoading}
                isDisabled={isLoading}
              />
            </div>
          </div>
        ) : (
          /* State 4: Default Upload Entrypoint */
          <CsvUploader onFileSelected={handleFileSelected} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-950 transition-colors">
        <p>© 2026 GrowEasy CRM. All rights reserved.</p>
      </footer>
    </div>
  );
}
