import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function AdminProblemsPanel() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setResult(null);
    } else {
      setResult({ success: false, message: 'Please select a valid JSON file' });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const response = await api.admin.importProblems(file);
      setResult({
        success: true,
        message: response.data.message,
        count: response.data.importedCount
      });
      setFile(null);
    } catch (error) {
      const errorData = error.response?.data;
      setResult({
        success: false,
        message: errorData?.message || 'Import failed',
        errors: errorData?.errors || []
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-400" />
          Import Problems
        </h3>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="problem-file"
            />
            <label
              htmlFor="problem-file"
              className="cursor-pointer text-blue-400 hover:text-blue-300"
            >
              Select JSON file to import
            </label>
            {file && (
              <p className="mt-2 text-sm text-gray-300">
                Selected: {file.name}
              </p>
            )}
          </div>

          {file && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {importing ? 'Importing...' : 'Import Problems'}
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className={`p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-900/20 border-green-500/30 text-green-300' 
            : 'bg-red-900/20 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-semibold">{result.message}</span>
          </div>
          
          {result.success && result.count && (
            <p className="text-sm">Successfully imported {result.count} problems</p>
          )}
          
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-semibold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Validation Errors:
              </p>
              {result.errors.map((error, index) => (
                <p key={index} className="text-xs ml-5">
                  Row {error.row}, {error.field}: {error.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h4 className="font-semibold mb-3 text-gray-300">Expected JSON Format:</h4>
        <pre className="text-xs bg-black/30 p-3 rounded overflow-x-auto text-gray-400">
{`[
  {
    "slug": "two-sum",
    "title": "Two Sum",
    "description": "Find two numbers that add up to target",
    "difficulty": "Easy",
    "testCases": [
      {
        "input": "[2,7,11,15], 9",
        "expectedOutput": "[0,1]"
      }
    ]
  }
]`}
        </pre>
      </div>
    </div>
  );
}