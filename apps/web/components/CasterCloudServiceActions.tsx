"use client";

import { useMemo, useState } from "react";
import { consoleServiceActions } from "../lib/castercloud-console-data";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type SessionResult = {
  status?: string;
  verified?: boolean;
  sessionId?: string;
  address?: string;
  reason?: string;
};

type ActionResult = {
  id?: string;
  status?: string;
  resource?: string;
  requestHash?: string;
  reason?: string;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const apiBase =
  process.env.NEXT_PUBLIC_CASTERCLOUD_CONSOLE_API_BASE_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8788";

function shorten(value: string) {
  if (!value) return "missing";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function resultToken(result: ActionResult | SessionResult) {
  const actionResult = result as ActionResult;
  if (typeof actionResult.requestHash === "string") return actionResult.requestHash;
  return (result as SessionResult).sessionId || "";
}

async function readJson<T>(route: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${route}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const json = (await response.json()) as T;
  if (!response.ok) {
    const reason = typeof json === "object" && json && "reason" in json ? String((json as { reason?: string }).reason) : "";
    throw new Error(reason || `Request failed with ${response.status}`);
  }
  return json;
}

export function CasterCloudServiceActions() {
  const [wallet, setWallet] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<ActionResult | SessionResult | null>(null);

  const sessionReady = useMemo(() => Boolean(wallet && sessionId), [wallet, sessionId]);

  async function connectSession() {
    setBusy("Connecting wallet");
    setError("");
    try {
      if (!window.ethereum) throw new Error("Browser wallet not found");
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const selected = accounts[0] || "";
      if (!selected) throw new Error("No wallet account selected");
      const message = [
        "CasterCloud Console Session",
        "version=1",
        "scope=service-actions",
        "liveMutation=false",
        `issuedAt=${new Date().toISOString()}`,
      ].join("\n");
      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [message, selected],
      })) as string;
      const session = await readJson<SessionResult>("/v1/wallet/session", {
        method: "POST",
        body: JSON.stringify({ address: selected, message, signature }),
      });
      setWallet(selected);
      setSessionId(session.sessionId || "");
      setLastResult(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function runAction(actionId: string) {
    const action = consoleServiceActions.find((item) => item.id === actionId);
    if (!action) return;
    setBusy(action.label);
    setError("");
    try {
      if (!sessionReady) throw new Error("Wallet session required");
      const result = await readJson<ActionResult>(action.endpoint, {
        method: action.method,
        headers: { authorization: `Bearer ${sessionId}` },
        body: JSON.stringify({
          ...action.body,
          requestedBy: wallet,
          actionId: action.id,
          rollbackTarget: "local-request-journal",
          evidencePath: ".quilibrium/castercloud-console-api/request-journal.jsonl",
        }),
      });
      setLastResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="service-action-console" aria-live="polite">
      <div className="service-action-header">
        <div>
          <strong>Owned service actions</strong>
          <p>Wallet sessions queue local dry-run receipts for every CasterCloud service surface.</p>
        </div>
        <button type="button" onClick={connectSession} disabled={Boolean(busy)}>
          Connect wallet
        </button>
      </div>
      <div className="approval-signer-row">
        <span>Wallet</span>
        <code>{shorten(wallet)}</code>
      </div>
      <div className="approval-signer-row">
        <span>Session</span>
        <code>{shorten(sessionId)}</code>
      </div>
      <div className="service-action-grid">
        {consoleServiceActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => runAction(action.id)}
            disabled={!sessionReady || Boolean(busy)}
            title={`${action.method} ${action.endpoint}`}
          >
            <span>{action.label}</span>
            <code>{action.resource}</code>
          </button>
        ))}
      </div>
      {busy ? <p className="approval-signer-status">{busy}</p> : null}
      {error ? <p className="approval-signer-status danger">{error}</p> : null}
      {lastResult ? (
        <div className="approval-signer-result">
          <span className={`pill ${lastResult.status === "passed" || lastResult.status === "queued_dry_run" ? "good" : "warn"}`}>
            {lastResult.status || "unknown"}
          </span>
          <code>{shorten(resultToken(lastResult))}</code>
          <span>{"resource" in lastResult ? lastResult.resource : "wallet-session"}</span>
        </div>
      ) : null}
    </div>
  );
}
