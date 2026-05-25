"use client";

import { useEffect, useMemo, useState } from "react";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type ApprovalMessage = {
  status: string;
  requestHash: string;
  message: string;
  messageHash: string;
  nextAction?: string;
};

type AllowlistMessage = {
  status: string;
  operatorWallets: string[];
  walletCount: number;
  message: string;
  messageHash: string;
  nextAction?: string;
};

type TargetConfirmationMessage = {
  status: string;
  cloudTargetHash: string;
  apiTargetHash: string;
  message: string;
  messageHash: string;
  nextAction?: string;
};

type TargetSigningHandoff = {
  status: string;
  messageReady?: boolean;
  operatorInputPresent?: boolean;
  messageHash?: string;
  cloudTargetHash?: string;
  apiTargetHash?: string;
  targetConfirmationStatus?: string;
  strictReadiness?: {
    status?: string;
    strictReady?: boolean;
    blockers?: string[];
  };
  nextAction?: string;
};

type PublicConsoleEnvStatus = {
  status?: string;
  importerReady?: boolean;
  envState?: Record<string, { present?: boolean; urlShape?: boolean; hostHash?: string; path?: string }>;
  strictReadiness?: {
    status?: string;
    blockers?: string[];
  };
  nextAction?: string;
};

type ImportResult = {
  status?: string;
  verified?: boolean;
  inputWritten?: boolean;
  redacted?: {
    signatureHash?: string;
  };
  reason?: string;
  nextAction?: string;
};

type CompletionAction = {
  id: string;
  label: string;
  endpoint: string;
  status: string;
  detail?: string;
  nextAction?: string;
};

type CompletionStatus = {
  status?: string;
  actionOrder?: CompletionAction[];
  strictReadiness?: {
    status?: string;
    blockers?: string[];
  };
  nextAction?: string;
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
    const message = typeof json === "object" && json && "reason" in json ? String((json as { reason?: string }).reason) : "";
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return json;
}

export function CasterCloudApprovalSigner() {
  const [approval, setApproval] = useState<ApprovalMessage | null>(null);
  const [allowlist, setAllowlist] = useState<AllowlistMessage | null>(null);
  const [targetHandoff, setTargetHandoff] = useState<TargetSigningHandoff | null>(null);
  const [targetConfirmation, setTargetConfirmation] = useState<TargetConfirmationMessage | null>(null);
  const [publicConsoleEnv, setPublicConsoleEnv] = useState<PublicConsoleEnvStatus | null>(null);
  const [wallet, setWallet] = useState("");
  const [consolePublicBaseUrl, setConsolePublicBaseUrl] = useState("https://cloud.casterchain.online/console/");
  const [consoleApiBaseUrl, setConsoleApiBaseUrl] = useState("https://cloud.casterchain.online");
  const [casterchainApiPublicBaseUrl, setCasterchainApiPublicBaseUrl] = useState("https://api.casterchain.online");
  const [allowlistSignature, setAllowlistSignature] = useState("");
  const [approvalSignature, setApprovalSignature] = useState("");
  const [targetConfirmationSignature, setTargetConfirmationSignature] = useState("");
  const [publicConsoleEnvResult, setPublicConsoleEnvResult] = useState<ImportResult | null>(null);
  const [allowlistResult, setAllowlistResult] = useState<ImportResult | null>(null);
  const [approvalResult, setApprovalResult] = useState<ImportResult | null>(null);
  const [targetConfirmationResult, setTargetConfirmationResult] = useState<ImportResult | null>(null);
  const [bundleResult, setBundleResult] = useState<ImportResult | null>(null);
  const [completion, setCompletion] = useState<CompletionStatus | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const canSignAllowlist = useMemo(() => Boolean(wallet && allowlist?.message), [wallet, allowlist]);
  const canImportAllowlist = useMemo(
    () => Boolean(canSignAllowlist && allowlistSignature),
    [canSignAllowlist, allowlistSignature]
  );
  const canSignApproval = useMemo(() => Boolean(wallet && approval?.message), [wallet, approval]);
  const canImportApproval = useMemo(
    () => Boolean(canSignApproval && approvalSignature),
    [canSignApproval, approvalSignature]
  );
  const canSignTargetConfirmation = useMemo(
    () => Boolean(wallet && targetConfirmation?.message),
    [wallet, targetConfirmation]
  );
  const canImportTargetConfirmation = useMemo(
    () => Boolean(canSignTargetConfirmation && targetConfirmationSignature),
    [canSignTargetConfirmation, targetConfirmationSignature]
  );
  const canImportEvidenceBundle = useMemo(
    () =>
      Boolean(
        wallet &&
          allowlist?.message &&
          targetConfirmation?.message &&
          allowlistSignature &&
          targetConfirmationSignature
      ),
    [wallet, allowlist, targetConfirmation, allowlistSignature, targetConfirmationSignature]
  );

  useEffect(() => {
    let cancelled = false;
    setBusy("Loading approval");
    Promise.allSettled([
      readJson<ApprovalMessage>("/v1/deployments/approvals/gitcaster/message"),
      readJson<TargetSigningHandoff>("/v1/public-endpoints/target-signing-handoff"),
      readJson<TargetConfirmationMessage>("/v1/public-endpoints/target-confirmation/message"),
      readJson<PublicConsoleEnvStatus>("/v1/console/public-console-env"),
    ])
      .then(([approvalResult, handoffResult, targetResult, publicConsoleEnvResult]) => {
        if (!cancelled) {
          if (approvalResult.status === "fulfilled") setApproval(approvalResult.value);
          if (handoffResult.status === "fulfilled") setTargetHandoff(handoffResult.value);
          if (targetResult.status === "fulfilled") setTargetConfirmation(targetResult.value);
          if (publicConsoleEnvResult.status === "fulfilled") setPublicConsoleEnv(publicConsoleEnvResult.value);
          const firstError =
            approvalResult.status === "rejected"
              ? approvalResult.reason
              : handoffResult.status === "rejected"
                ? handoffResult.reason
              : targetResult.status === "rejected"
                ? targetResult.reason
              : publicConsoleEnvResult.status === "rejected"
                ? publicConsoleEnvResult.reason
                : null;
          setError(firstError instanceof Error ? firstError.message : firstError ? String(firstError) : "");
        }
      })
      .finally(() => {
        if (!cancelled) setBusy("");
      });
    void refreshCompletion(true);
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshCompletion(silent = false) {
    try {
      const json = await readJson<CompletionStatus>("/v1/deployments/approvals/gitcaster/completion");
      setCompletion(json);
      if (!silent) setError("");
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function refreshAllowlist(address: string) {
    if (!address) return;
    const route = `/v1/iam/operators/allowlist/message?wallet=${encodeURIComponent(address)}`;
    const json = await readJson<AllowlistMessage>(route);
    setAllowlist(json);
  }

  async function refreshPublicConsoleEnv() {
    const json = await readJson<PublicConsoleEnvStatus>("/v1/console/public-console-env");
    setPublicConsoleEnv(json);
  }

  async function submitPublicConsoleEnv(writeInput: boolean) {
    setBusy(writeInput ? "Staging endpoint env" : "Verifying endpoint env");
    setError("");
    try {
      const json = await readJson<ImportResult>("/v1/console/public-console-env/import", {
        method: "POST",
        body: JSON.stringify({
          consolePublicBaseUrl,
          consoleApiBaseUrl,
          casterchainApiPublicBaseUrl,
          dryRun: !writeInput,
          allowLocalImport: writeInput,
        }),
      });
      setPublicConsoleEnvResult(json);
      await refreshPublicConsoleEnv();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function connectWallet() {
    setBusy("Connecting wallet");
    setError("");
    try {
      if (!window.ethereum) throw new Error("Browser wallet not found");
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const selected = accounts[0] || "";
      setWallet(selected);
      setAllowlistSignature("");
      setApprovalSignature("");
      setTargetConfirmationSignature("");
      setPublicConsoleEnvResult(null);
      setAllowlistResult(null);
      setApprovalResult(null);
      setTargetConfirmationResult(null);
      setBundleResult(null);
      await refreshAllowlist(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function signAllowlist() {
    setBusy("Signing allowlist");
    setError("");
    try {
      if (!window.ethereum) throw new Error("Browser wallet not found");
      if (!wallet || !allowlist?.message) throw new Error("Allowlist message is not ready");
      const signed = (await window.ethereum.request({
        method: "personal_sign",
        params: [allowlist.message, wallet],
      })) as string;
      setAllowlistSignature(signed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function submitAllowlist(writeInput: boolean) {
    setBusy(writeInput ? "Writing allowlist" : "Verifying allowlist");
    setError("");
    try {
      if (!allowlist) throw new Error("Allowlist message is not ready");
      const json = await readJson<ImportResult>("/v1/iam/operators/allowlist/import", {
        method: "POST",
        body: JSON.stringify({
          operatorWallets: allowlist.operatorWallets,
          bootstrapWalletAddress: wallet,
          message: allowlist.message,
          signature: allowlistSignature,
          dryRun: !writeInput,
          allowLocalImport: writeInput,
          signedAt: new Date().toISOString(),
        }),
      });
      setAllowlistResult(json);
      await refreshCompletion(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function signApproval() {
    setBusy("Signing approval");
    setError("");
    try {
      if (!window.ethereum) throw new Error("Browser wallet not found");
      if (!wallet || !approval?.message) throw new Error("Approval message is not ready");
      const signed = (await window.ethereum.request({
        method: "personal_sign",
        params: [approval.message, wallet],
      })) as string;
      setApprovalSignature(signed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function submitApproval(writeInput: boolean) {
    setBusy(writeInput ? "Writing approval" : "Verifying approval");
    setError("");
    try {
      if (!approval) throw new Error("Approval message is not ready");
      const json = await readJson<ImportResult>("/v1/deployments/approvals/gitcaster/import", {
        method: "POST",
        body: JSON.stringify({
          operatorWalletAddress: wallet,
          approvedRequestHash: approval.requestHash,
          message: approval.message,
          signature: approvalSignature,
          dryRun: !writeInput,
          allowLocalImport: writeInput,
          signedAt: new Date().toISOString(),
        }),
      });
      setApprovalResult(json);
      await refreshCompletion(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function signTargetConfirmation() {
    setBusy("Signing target confirmation");
    setError("");
    try {
      if (!window.ethereum) throw new Error("Browser wallet not found");
      if (!wallet || !targetConfirmation?.message) throw new Error("Target confirmation message is not ready");
      const signed = (await window.ethereum.request({
        method: "personal_sign",
        params: [targetConfirmation.message, wallet],
      })) as string;
      setTargetConfirmationSignature(signed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function submitTargetConfirmation(writeInput: boolean) {
    setBusy(writeInput ? "Writing target confirmation" : "Verifying target confirmation");
    setError("");
    try {
      if (!targetConfirmation) throw new Error("Target confirmation message is not ready");
      const json = await readJson<ImportResult>("/v1/public-endpoints/target-confirmation/import", {
        method: "POST",
        body: JSON.stringify({
          operatorWalletAddress: wallet,
          expectedCloudTargetHash: targetConfirmation.cloudTargetHash,
          expectedApiTargetHash: targetConfirmation.apiTargetHash,
          message: targetConfirmation.message,
          signature: targetConfirmationSignature,
          dryRun: !writeInput,
          allowLocalImport: writeInput,
          signedAt: new Date().toISOString(),
        }),
      });
      setTargetConfirmationResult(json);
      const handoff = await readJson<TargetSigningHandoff>("/v1/public-endpoints/target-signing-handoff");
      setTargetHandoff(handoff);
      await refreshCompletion(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function submitEvidenceBundle(writeInput: boolean) {
    setBusy(writeInput ? "Writing evidence bundle" : "Verifying evidence bundle");
    setError("");
    try {
      if (!allowlist) throw new Error("Allowlist message is not ready");
      if (!targetConfirmation) throw new Error("Target confirmation message is not ready");
      const json = await readJson<ImportResult>("/v1/console/operator-evidence-bundle/import", {
        method: "POST",
        body: JSON.stringify({
          dryRun: !writeInput,
          allowLocalImport: writeInput,
          targetConfirmation: {
            operatorWalletAddress: wallet,
            expectedCloudTargetHash: targetConfirmation.cloudTargetHash,
            expectedApiTargetHash: targetConfirmation.apiTargetHash,
            message: targetConfirmation.message,
            signature: targetConfirmationSignature,
            signedAt: new Date().toISOString(),
          },
          operatorAllowlist: {
            operatorWallets: allowlist.operatorWallets,
            bootstrapWalletAddress: wallet,
            message: allowlist.message,
            signature: allowlistSignature,
            signedAt: new Date().toISOString(),
          },
        }),
      });
      setBundleResult(json);
      const handoff = await readJson<TargetSigningHandoff>("/v1/public-endpoints/target-signing-handoff");
      setTargetHandoff(handoff);
      await refreshCompletion(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="approval-signer" aria-live="polite">
      <div className="approval-signer-row">
        <span>Wallet</span>
        <code>{shorten(wallet)}</code>
      </div>
      <div className="approval-signer-actions">
        <button type="button" onClick={connectWallet} disabled={Boolean(busy)}>
          Connect wallet
        </button>
        <button type="button" onClick={() => refreshCompletion(false)} disabled={Boolean(busy)}>
          Refresh status
        </button>
      </div>

      {completion ? (
        <div className="approval-signer-step">
          <strong>Completion status</strong>
          <div className="approval-signer-result">
            <span className={`pill ${completion.strictReadiness?.status === "passed" ? "good" : "warn"}`}>
              {completion.strictReadiness?.status || completion.status || "unknown"}
            </span>
            <span>{completion.nextAction || "Operator approval evidence is checked by local CasterCloud gates."}</span>
          </div>
          <div className="approval-action-list">
            {(completion.actionOrder || []).map((action) => (
              <div className="approval-action-item" key={action.id}>
                <span className={`pill ${action.status === "passed" ? "good" : "warn"}`}>{action.status}</span>
                <strong>{action.label}</strong>
                <code>{action.endpoint}</code>
              </div>
            ))}
          </div>
          {completion.strictReadiness?.blockers?.length ? (
            <div className="approval-blockers">
              {completion.strictReadiness.blockers.slice(0, 6).map((blocker) => (
                <span key={blocker}>{blocker}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="approval-signer-step">
        <strong>Public console URLs</strong>
        <div className="approval-signer-result">
          <span className={`pill ${publicConsoleEnv?.status === "passed" ? "good" : "warn"}`}>
            {publicConsoleEnv?.status || "loading"}
          </span>
          <span>{publicConsoleEnv?.nextAction || "Stage the public console and API endpoint env."}</span>
        </div>
        <label className="approval-signer-input">
          <span>Console</span>
          <input
            value={consolePublicBaseUrl}
            onChange={(event) => setConsolePublicBaseUrl(event.target.value)}
            placeholder="https://cloud.casterchain.online/console/"
          />
        </label>
        <label className="approval-signer-input">
          <span>Console API</span>
          <input
            value={consoleApiBaseUrl}
            onChange={(event) => setConsoleApiBaseUrl(event.target.value)}
            placeholder="https://cloud.casterchain.online"
          />
        </label>
        <label className="approval-signer-input">
          <span>Runtime API</span>
          <input
            value={casterchainApiPublicBaseUrl}
            onChange={(event) => setCasterchainApiPublicBaseUrl(event.target.value)}
            placeholder="https://api.casterchain.online"
          />
        </label>
        <div className="approval-signer-actions">
          <button type="button" onClick={() => submitPublicConsoleEnv(false)} disabled={Boolean(busy)}>
            Verify URLs
          </button>
          <button type="button" onClick={() => submitPublicConsoleEnv(true)} disabled={Boolean(busy)}>
            Stage local env
          </button>
        </div>
        <div className="approval-signer-row">
          <span>Strict gate</span>
          <code>{publicConsoleEnv?.strictReadiness?.status || "unknown"}</code>
        </div>
        {publicConsoleEnv?.strictReadiness?.blockers?.length ? (
          <div className="approval-blockers">
            {publicConsoleEnv.strictReadiness.blockers.slice(0, 4).map((blocker) => (
              <span key={blocker}>{blocker}</span>
            ))}
          </div>
        ) : null}
        {publicConsoleEnvResult ? (
          <div className="approval-signer-result">
            <span className={`pill ${publicConsoleEnvResult.status === "passed" ? "good" : "warn"}`}>
              {publicConsoleEnvResult.status || "unknown"}
            </span>
            <span>{publicConsoleEnvResult.inputWritten ? "input written" : "dry run"}</span>
          </div>
        ) : null}
      </div>

      <div className="approval-signer-step">
        <strong>Current endpoint blocker</strong>
        <div className="approval-signer-result">
          <span className={`pill ${targetHandoff?.status === "passed" ? "good" : "warn"}`}>
            {targetHandoff?.status || "loading"}
          </span>
          <span>{targetHandoff?.nextAction || "Load the public endpoint target signing handoff."}</span>
        </div>
        <div className="approval-signer-row">
          <span>Message ready</span>
          <code>{targetHandoff?.messageReady ? "yes" : "no"}</code>
        </div>
        <div className="approval-signer-row">
          <span>Operator input</span>
          <code>{targetHandoff?.operatorInputPresent ? "present" : "missing"}</code>
        </div>
        <div className="approval-signer-row">
          <span>Message</span>
          <code>{shorten(targetHandoff?.messageHash || "")}</code>
        </div>
        <div className="approval-signer-row">
          <span>Strict gate</span>
          <code>{targetHandoff?.strictReadiness?.status || "unknown"}</code>
        </div>
        {targetHandoff?.strictReadiness?.blockers?.length ? (
          <div className="approval-blockers">
            {targetHandoff.strictReadiness.blockers.slice(0, 4).map((blocker) => (
              <span key={blocker}>{blocker}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="approval-signer-step">
        <strong>Operator allowlist</strong>
        <div className="approval-signer-row">
          <span>Wallets</span>
          <code>{allowlist?.walletCount ?? 0}</code>
        </div>
        <div className="approval-signer-row">
          <span>Message</span>
          <code>{shorten(allowlist?.messageHash || "")}</code>
        </div>
        <div className="approval-signer-actions">
          <button type="button" onClick={signAllowlist} disabled={!canSignAllowlist || Boolean(busy)}>
            Sign allowlist
          </button>
          <button type="button" onClick={() => submitAllowlist(false)} disabled={!canImportAllowlist || Boolean(busy)}>
            Verify
          </button>
          <button type="button" onClick={() => submitAllowlist(true)} disabled={!canImportAllowlist || Boolean(busy)}>
            Import evidence
          </button>
        </div>
        {allowlistResult ? (
          <div className="approval-signer-result">
            <span className={`pill ${allowlistResult.status === "passed" ? "good" : "warn"}`}>
              {allowlistResult.status || "unknown"}
            </span>
            <code>{shorten(allowlistResult.redacted?.signatureHash || "")}</code>
            <span>{allowlistResult.inputWritten ? "input written" : "dry run"}</span>
          </div>
        ) : null}
      </div>

      <div className="approval-signer-step">
        <strong>GitCaster approval</strong>
        <div className="approval-signer-row">
          <span>Request</span>
          <code>{shorten(approval?.requestHash || "")}</code>
        </div>
        <div className="approval-signer-row">
          <span>Message</span>
          <code>{shorten(approval?.messageHash || "")}</code>
        </div>
        <div className="approval-signer-actions">
          <button type="button" onClick={signApproval} disabled={!canSignApproval || Boolean(busy)}>
            Sign approval
          </button>
          <button type="button" onClick={() => submitApproval(false)} disabled={!canImportApproval || Boolean(busy)}>
            Verify
          </button>
          <button type="button" onClick={() => submitApproval(true)} disabled={!canImportApproval || Boolean(busy)}>
            Import evidence
          </button>
        </div>
        {approvalResult ? (
          <div className="approval-signer-result">
            <span className={`pill ${approvalResult.status === "passed" ? "good" : "warn"}`}>
              {approvalResult.status || "unknown"}
            </span>
            <code>{shorten(approvalResult.redacted?.signatureHash || "")}</code>
            <span>{approvalResult.inputWritten ? "input written" : "dry run"}</span>
          </div>
        ) : null}
      </div>

      <div className="approval-signer-step">
        <strong>Public endpoint targets</strong>
        <div className="approval-signer-row">
          <span>Cloud target</span>
          <code>{shorten(targetConfirmation?.cloudTargetHash || "")}</code>
        </div>
        <div className="approval-signer-row">
          <span>API target</span>
          <code>{shorten(targetConfirmation?.apiTargetHash || "")}</code>
        </div>
        <div className="approval-signer-row">
          <span>Message</span>
          <code>{shorten(targetConfirmation?.messageHash || "")}</code>
        </div>
        <div className="approval-signer-actions">
          <button type="button" onClick={signTargetConfirmation} disabled={!canSignTargetConfirmation || Boolean(busy)}>
            Sign targets
          </button>
          <button
            type="button"
            onClick={() => submitTargetConfirmation(false)}
            disabled={!canImportTargetConfirmation || Boolean(busy)}
          >
            Verify
          </button>
          <button
            type="button"
            onClick={() => submitTargetConfirmation(true)}
            disabled={!canImportTargetConfirmation || Boolean(busy)}
          >
            Import evidence
          </button>
        </div>
        {targetConfirmationResult ? (
          <div className="approval-signer-result">
            <span className={`pill ${targetConfirmationResult.status === "passed" ? "good" : "warn"}`}>
              {targetConfirmationResult.status || "unknown"}
            </span>
            <code>{shorten(targetConfirmationResult.redacted?.signatureHash || "")}</code>
            <span>{targetConfirmationResult.inputWritten ? "input written" : "dry run"}</span>
          </div>
        ) : null}
      </div>

      <div className="approval-signer-step">
        <strong>Operator evidence bundle</strong>
        <div className="approval-signer-row">
          <span>Target signature</span>
          <code>{targetConfirmationSignature ? "ready" : "missing"}</code>
        </div>
        <div className="approval-signer-row">
          <span>Allowlist signature</span>
          <code>{allowlistSignature ? "ready" : "missing"}</code>
        </div>
        <div className="approval-signer-actions">
          <button type="button" onClick={() => submitEvidenceBundle(false)} disabled={!canImportEvidenceBundle || Boolean(busy)}>
            Verify bundle
          </button>
          <button type="button" onClick={() => submitEvidenceBundle(true)} disabled={!canImportEvidenceBundle || Boolean(busy)}>
            Import bundle evidence
          </button>
        </div>
        {bundleResult ? (
          <div className="approval-signer-result">
            <span className={`pill ${bundleResult.status === "passed" ? "good" : "warn"}`}>
              {bundleResult.status || "unknown"}
            </span>
            <code>{bundleResult.verified ? "verified" : "not verified"}</code>
            <span>{bundleResult.inputWritten ? "input written" : "dry run"}</span>
          </div>
        ) : null}
      </div>

      {busy ? <p className="approval-signer-status">{busy}</p> : null}
      {error ? <p className="approval-signer-status danger">{error}</p> : null}
    </div>
  );
}
