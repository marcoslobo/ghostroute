/**
 * Backup & Recovery Section
 *
 * Critical security feature - allows users to:
 * - Export notes as JSON backup
 * - Import notes from backup
 * - Download backup file automatically after deposit
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { exportNotes, importNotes } from '@/services/noteStorage';
import { useNotes } from '@/hooks/utxo/useNotes';

export function BackupSection() {
  const { address } = useAccount();
  const { refreshNotes } = useNotes();
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Export notes to JSON file
  const handleExport = useCallback(() => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const backup = exportNotes(address);
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `ghostroute-backup-${address.slice(0, 8)}-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('✅ Backup downloaded successfully!');
    } catch (error) {
      console.error('[BackupSection] Export error:', error);
      alert('❌ Failed to export backup');
    }
  }, [address]);

  // Import notes from JSON
  const handleImport = useCallback(() => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!importText.trim()) {
      setImportError('Please paste your backup JSON');
      return;
    }

    setImportError(null);
    setImportSuccess(false);

    try {
      // Validate JSON format
      JSON.parse(importText);

      // Import notes
      importNotes(address, importText);

      // Refresh notes display
      refreshNotes();

      setImportSuccess(true);
      setImportText('');

      alert('✅ Backup imported successfully!');
    } catch (error) {
      console.error('[BackupSection] Import error:', error);
      setImportError(
        error instanceof Error ? error.message : 'Invalid backup format'
      );
    }
  }, [address, importText, refreshNotes]);

  // Import from file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
    };
    reader.readAsText(file);
  }, []);

  if (!address) {
    return (
      <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6">
        <h3 className="text-lg font-semibold mb-2">💾 Backup & Recovery</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Connect your wallet to manage backups
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <h3 className="text-lg font-semibold mb-4">💾 Backup & Recovery</h3>

      {/* Warning Banner */}
      <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-semibold text-red-900 dark:text-red-200 mb-1">
              Backup is CRITICAL
            </h4>
            <p className="text-sm text-red-800 dark:text-red-300">
              Without a backup, if you lose access to this browser, you will{' '}
              <strong>permanently lose access to your funds</strong>. There is no recovery
              mechanism.
            </p>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">📥 Export Backup</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Download all your notes as a JSON file. Store it securely!
        </p>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Download Backup
        </button>
      </div>

      <hr className="border-gray-300 dark:border-gray-700 my-6" />

      {/* Import Section */}
      <div>
        <h4 className="font-medium mb-2">📤 Import Backup</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Restore your notes from a backup file
        </p>

        {/* File Upload */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-2">
            Upload Backup File
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-900 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400 dark:hover:file:bg-blue-900/30"
          />
        </div>

        {/* Or paste JSON */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-2">
            Or Paste Backup JSON
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='[{"commitment": "0x...", "nullifier": "0x...", ...}]'
            rows={6}
            className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
          />
        </div>

        {/* Error Display */}
        {importError && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300">
            ❌ {importError}
          </div>
        )}

        {/* Success Display */}
        {importSuccess && (
          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-300">
            ✅ Backup imported successfully!
          </div>
        )}

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={!importText.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          Import Backup
        </button>
      </div>

      {/* Security Tips */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 text-sm">
          💡 Security Best Practices
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Store backups in multiple secure locations</li>
          <li>Use a password manager (1Password, Bitwarden, etc.)</li>
          <li>Consider printing on paper (cold storage)</li>
          <li>Never share your backup with anyone</li>
          <li>Backup after EVERY deposit transaction</li>
        </ul>
      </div>
    </div>
  );
}
