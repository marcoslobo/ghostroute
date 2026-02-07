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
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

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
      <Card padding="md">
        <h3 className="text-lg font-semibold mb-2">💾 Backup & Recovery</h3>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to manage backups
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <h3 className="text-lg font-semibold mb-4">💾 Backup & Recovery</h3>

      {/* Warning Banner */}
      <Alert variant="error" className="mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-semibold mb-1">
              Backup is CRITICAL
            </h4>
            <p className="text-sm">
              Without a backup, if you lose access to this browser, you will{' '}
              <strong>permanently lose access to your funds</strong>. There is no recovery
              mechanism.
            </p>
          </div>
        </div>
      </Alert>

      {/* Export Section */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">📥 Export Backup</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Download all your notes as a JSON file. Store it securely!
        </p>
        <Button onClick={handleExport} variant="primary">
          Download Backup
        </Button>
      </div>

      <hr className="border-ghost-border my-6" />

      {/* Import Section */}
      <div>
        <h4 className="font-medium mb-2">📤 Import Backup</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Restore your notes from a backup file
        </p>

        {/* File Upload */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-foreground mb-2">
            Upload Backup File
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-ghost-cyan/10 file:text-ghost-cyan hover:file:bg-ghost-cyan/20 file:transition-colors"
          />
        </div>

        {/* Or paste JSON */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-foreground mb-2">
            Or Paste Backup JSON
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='[{"commitment": "0x...", "nullifier": "0x...", ...}]'
            rows={6}
            className="w-full p-3 border rounded-lg bg-input text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ghost-cyan focus:border-ghost-cyan border-border placeholder-muted-foreground"
          />
        </div>

        {/* Error Display */}
        {importError && (
          <Alert variant="error" className="mb-3">
            <span className="text-sm">❌ {importError}</span>
          </Alert>
        )}

        {/* Success Display */}
        {importSuccess && (
          <Alert variant="success" className="mb-3">
            <span className="text-sm">✅ Backup imported successfully!</span>
          </Alert>
        )}

        {/* Import Button */}
        <Button
          onClick={handleImport}
          disabled={!importText.trim()}
          variant="primary"
        >
          Import Backup
        </Button>
      </div>

      {/* Security Tips */}
      <Alert variant="info" className="mt-6">
        <div>
          <h4 className="font-semibold mb-2 text-sm">
            💡 Security Best Practices
          </h4>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Store backups in multiple secure locations</li>
            <li>Use a password manager (1Password, Bitwarden, etc.)</li>
            <li>Consider printing on paper (cold storage)</li>
            <li>Never share your backup with anyone</li>
            <li>Backup after EVERY deposit transaction</li>
          </ul>
        </div>
      </Alert>
    </Card>
  );
}
