/**
 * SocialGraphExport — manage the portable social graph and DID document.
 */

import { useState, useRef, type ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useVaultStore } from '../../store/vault';
import { useWallet } from '../../hooks/useWallet';
import {
  buildDIDDocument,
  exportDIDDocument,
  importDIDDocument,
  type ContactEntry,
} from '../../lib/did';
import { uploadEncryptedBlob } from '../../lib/storacha';

const PLATFORMS = ['twitter', 'farcaster', 'lens'];

/** Portable social graph management with DID document export/import. */
export function SocialGraphExport() {
  const { walletAddress } = useWallet();
  const contacts = useVaultStore((s) => s.contacts);
  const addContact = useVaultStore((s) => s.addContact);
  const removeContact = useVaultStore((s) => s.removeContact);
  const setSocialGraphCid = useVaultStore((s) => s.setSocialGraphCid);
  const socialGraphCid = useVaultStore((s) => s.socialGraphCid);
  const setLoading = useVaultStore((s) => s.setLoading);
  const setError = useVaultStore((s) => s.setError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [walletAddr, setWalletAddr] = useState('');
  const [platformHandles, setPlatformHandles] = useState<Record<string, string>>({});
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [exportedCid, setExportedCid] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const handleAddContact = () => {
    if (!name) return;
    const contact: ContactEntry = {
      id: uuidv4(),
      name,
      email: email || undefined,
      walletAddress: walletAddr || undefined,
      platforms: platformHandles,
      addedAt: Date.now(),
    };
    addContact(contact);
    setName('');
    setEmail('');
    setWalletAddr('');
    setPlatformHandles({});
  };

  const handleExport = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const doc = buildDIDDocument(walletAddress, contacts);
      const json = exportDIDDocument(doc);
      const cid = await uploadEncryptedBlob(json, 'social-graph.json');
      setSocialGraphCid(cid);
      setExportedCid(cid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { contacts: imported } = importDIDDocument(text);
      imported.forEach((c) => addContact(c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const didDoc = walletAddress
    ? buildDIDDocument(walletAddress, contacts)
    : null;

  const shortAddr = (addr: string) =>
    `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;

  return (
    <div className="space-y-6">
      {/* User's own DID */}
      {walletAddress && (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
          <p className="text-xs text-gray-400 mb-1">Your DID</p>
          <p className="font-mono text-sm text-indigo-400 break-all">
            did:pkh:eip155:1:{walletAddress.toLowerCase()}
          </p>
        </div>
      )}

      {/* Add contact form */}
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-300">Add Contact</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1" htmlFor="contact-name">
              Name *
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              aria-label="Contact name"
              placeholder="Alice"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1" htmlFor="contact-email">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              aria-label="Contact email"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1" htmlFor="contact-wallet">
              Wallet Address
            </label>
            <input
              id="contact-wallet"
              type="text"
              value={walletAddr}
              onChange={(e) => setWalletAddr(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              aria-label="Contact wallet address"
              placeholder="0x..."
            />
          </div>
        </div>
        <div className="space-y-2">
          {PLATFORMS.map((p) => (
            <div key={p} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20 capitalize">{p}</span>
              <input
                type="text"
                value={platformHandles[p] ?? ''}
                onChange={(e) =>
                  setPlatformHandles((prev) => ({ ...prev, [p]: e.target.value }))
                }
                placeholder={`@handle`}
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                aria-label={`${p} handle`}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleAddContact}
          disabled={!name}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          aria-label="Add contact to social graph"
        >
          Add Contact
        </button>
      </div>

      {/* Contact list */}
      {contacts.length > 0 && (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Contacts ({contacts.length})</h4>
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-gray-200">{c.name}</p>
                {c.walletAddress && (
                  <p className="text-xs font-mono text-gray-500">{shortAddr(c.walletAddress)}</p>
                )}
                <div className="flex gap-2 mt-1 flex-wrap">
                  {Object.entries(c.platforms).map(([platform, handle]) =>
                    handle ? (
                      <span
                        key={platform}
                        className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded capitalize"
                      >
                        {platform}: {handle}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
              <button
                onClick={() => removeContact(c.id)}
                className="text-red-400 hover:text-red-300 text-xs ml-4"
                aria-label={`Remove contact ${c.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Export / import */}
      <div className="flex gap-3">
        <button
          onClick={() => void handleExport()}
          disabled={contacts.length === 0}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          aria-label="Export social graph as DID document"
        >
          Export Graph
        </button>
        <button
          onClick={() => importRef.current?.click()}
          className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg px-4 py-2 text-sm transition-colors"
          aria-label="Import social graph from DID document"
        >
          Import Graph
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
          aria-label="Import DID document file"
        />
        {didDoc && (
          <button
            onClick={() => setShowDocPreview((v) => !v)}
            className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg px-4 py-2 text-sm transition-colors"
            aria-label="Toggle DID document preview"
          >
            {showDocPreview ? 'Hide' : 'Preview'} DID Doc
          </button>
        )}
      </div>

      {exportedCid && (
        <div className="rounded-xl border border-emerald-700 bg-emerald-900/20 p-4 space-y-1">
          <p className="text-xs text-emerald-400 font-medium">Graph exported!</p>
          <p className="text-xs text-gray-400">
            CID:{' '}
            <span className="font-mono">{exportedCid}</span>
          </p>
          <a
            href={`https://${exportedCid}.ipfs.w3s.link`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:underline"
          >
            View on IPFS gateway ↗
          </a>
        </div>
      )}

      {socialGraphCid && !exportedCid && (
        <p className="text-xs text-gray-500">
          Stored CID: <span className="font-mono">{socialGraphCid}</span>
        </p>
      )}

      {showDocPreview && didDoc && (
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <p className="text-xs text-gray-400 mb-2">DID Document</p>
          <pre className="text-xs overflow-auto max-h-64 text-gray-300 font-mono whitespace-pre-wrap">
            {exportDIDDocument(didDoc)}
          </pre>
        </div>
      )}
    </div>
  );
}
