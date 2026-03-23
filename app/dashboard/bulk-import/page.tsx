'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function BulkImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndSetFile(droppedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = async (selectedFile: File) => {
        setError('');
        setResult(null);
        setValidationResult(null);

        // Accept only excel files
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
            setError('Please upload a valid Excel file (.xlsx or .xls)');
            setFile(null);
            return;
        }

        setFile(selectedFile);

        // Auto-validate the file
        setIsValidating(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('validateOnly', 'true');

        try {
            const res = await fetch('/api/import/excel', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Validation failed');
            setValidationResult(data);
        } catch (err: any) {
            setError(err.message);
            setFile(null); // Remove file if we couldn't even parse it
        } finally {
            setIsValidating(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError('');
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/import/excel', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Upload className="w-6 h-6 text-primary-600" />
                    Bulk Data Import
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Upload an Excel file to bulk import legacy chat session records.
                </p>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Upload Rules</h2>
                    <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-2">
                        <li><strong>Supports two formats:</strong> Standard Template and <code>History.xlsx</code> Template.</li>
                        <li><strong>Standard format:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-pink-600 dark:text-pink-400">Date, AGENT, PROPERTY, TIME, FULL NAME, EMAIL ADDRESS, SCHOOL/COLLEGE, COUNTRY, TYPE, ISSUE, QUERY DESCRIPTION, RESOLUTION, Chat ID, Replied via email</code></li>
                        <li><strong>History.xlsx format:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-pink-600 dark:text-pink-400">Visitor ID, Created Time, Attender, Department, Name, Email Address, Phone Number, Country/Region, Embed, Question, Status, Conversation ID, Last Email Sent Time, Attender Email, Role</code></li>
                        <li><strong>Chat ID / Conversation ID</strong> must be unique for each row.</li>
                        <li>Master data texts (Agent, Department, Type, Issue) must match existing names. TYPE and ISSUE fallback to existing ones if missing.</li>
                        <li>Resolution, Status, and Email Sent states are inferred from logical fields.</li>
                    </ul>
                </div>

                <div className="p-8">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                            }`}
                    >
                        <FileSpreadsheet className={`w-12 h-12 mb-4 ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />

                        {file ? (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-800 dark:text-white">{file.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Drag and drop your Excel file here
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                    .xlsx or .xls files up to 10MB
                                </p>

                                <label className="cursor-pointer bg-white dark:bg-slate-800 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                                    Browse Files
                                    <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                                </label>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg flex items-start gap-3 border border-red-100 dark:border-red-900/50">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {isValidating && (
                        <div className="mt-6 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Validating file...</p>
                            <p className="text-xs text-slate-500">Checking for errors and missing data</p>
                        </div>
                    )}

                    {!isValidating && validationResult && (
                        <div className={`mt-6 p-6 rounded-xl border ${validationResult.errors.length > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30'}`}>
                            <div className="flex items-start gap-3">
                                {validationResult.errors.length > 0 ? (
                                    <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                ) : (
                                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <h3 className={`text-base font-semibold mb-1 ${validationResult.errors.length > 0 ? 'text-red-800 dark:text-red-400' : 'text-green-800 dark:text-green-400'}`}>
                                        {validationResult.errors.length > 0 ? `Validation Failed (${validationResult.errors.length} errors)` : 'File Validated Successfully'}
                                    </h3>
                                    <p className={`text-sm mb-4 ${validationResult.errors.length > 0 ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'}`}>
                                        {validationResult.errors.length > 0
                                            ? 'Please fix the following errors in your Excel file and re-upload.'
                                            : `${validationResult.summary.inserted} rows are ready to be imported.`
                                        }
                                    </p>

                                    {validationResult.errors.length > 0 && (
                                        <div className="bg-white dark:bg-slate-900 rounded border border-red-100 dark:border-red-900/30 overflow-hidden max-h-60 overflow-y-auto">
                                            <ul className="text-xs font-mono p-3 space-y-2">
                                                {validationResult.errors.map((err: string, i: number) => (
                                                    <li key={i} className="text-red-600 dark:text-red-400">{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={!file || isUploading || isValidating || (validationResult && validationResult.errors.length > 0)}
                            className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                        >
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {isUploading ? 'Importing Data...' : 'Start Import'}
                        </button>
                    </div>
                </div>
            </div>

            {result && (
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-slate-800/50 hover:shadow-md transition-all duration-300 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Import Complete</h2>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Rows Processed</p>
                                <p className="text-3xl font-bold text-slate-800 dark:text-white">{result.summary.total}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/30 text-center">
                                <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Successfully Inserted</p>
                                <p className="text-3xl font-bold text-green-700 dark:text-green-500">{result.summary.inserted}</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30 text-center">
                                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Failed Rows</p>
                                <p className="text-3xl font-bold text-red-700 dark:text-red-500">{result.summary.failed}</p>
                            </div>
                        </div>

                        {result.errors && result.errors.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    Error Details
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 max-h-64 overflow-y-auto">
                                    <ul className="space-y-2">
                                        {result.errors.map((err: string, idx: number) => (
                                            <li key={idx} className="text-xs text-red-600 dark:text-red-400 font-mono bg-white dark:bg-slate-900 p-2 rounded border border-red-100 dark:border-red-900/30">
                                                {err}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
