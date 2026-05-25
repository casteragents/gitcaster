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
  process.env.NEXT_PUBLIC_CASTERCLOUD_CONSOLE_API_BASE_URL?.replace(/\/+$/, "") || "";
const publicPreviewMode = !apiBase;
const previewWallet = "public-preview-operator";
const previewCompletion: CompletionStatus = {
  status: "public-alpha",
  actionOrder: [
    {
      id: "public-pages-smoke",
      label: "Public website smoke",
      endpoint: "https://casteragents.github.io/gitcaster/",
      status: "passed",
      detail: "GitHub Pages renders without requiring private operator APIs.",
    },
    {
      id: "api-handoff",
      label: "Owned API handoff",
      endpoint: "NEXT_PUBLIC_CASTERCLOUD_CONSOLE_API_BASE_URL",
      status: "blocked_external",
      detail: "Set this env to execute live wallet-gated API actions.",
    },
  ],
  strictReadiness: {
    status: "public-alpha",
    blockers: ["Owned CasterCloud API is not connected to this public static build."],
  },
  nextAction: "Public preview is live. Connect the owned CasterCloud API for live operator imports.",
};
const previewApproval: ApprovalMessage = {
  status: "public-alpha",
  requestHash: "preview-gitcaster-deploy-request",
  message: "GitCaster public alpha deployment preview approval",
  messageHash: "preview-gitcaster-approval-message",
  nextAction: "Connect an owned API endpoint to verify live operator approval.",
};
const previewTargetConfirmation: TargetConfirmationMessage = {
  status: "public-alpha",
  cloudTargetHash: "preview-cloud-target",
  apiTargetHash: "preview-api-target",
  message: "GitCaster public alpha endpoint target preview",
  messageHash: "preview-target-confirmation-message",
  nextAction: "Connect public endpoint target proof before live deployment claims.",
};
const previewPublicConsoleEnv: PublicConsoleEnvStatus = {
  status: "public-alpha",
  importerReady: false,
  strictReadiness: {
    status: "blocked_external",
    blockers: ["NEXT_PUBLIC_CASTERCLOUD_CONSOLE_API_BASE_URL is not set for this static public build."],
  },
  nextAction: "Public preview can validate URL shape locally; live import requires the owned API.",
};
const previewTargetHandoff: TargetSigningHandoff = {
  status: "public-alpha",
  messageReady: true,
  operatorInputPresent: false,
  messageHash: "preview-target-handoff-message",
  cloudTargetHash: "preview-cloud-target",
  apiTargetHash: "preview-api-target",
  targetConfirmationStatus: "preview",
  strictReadiness: {
    status: "blocked_external",
    strictReady: false,
    blockers: ["Live endpoint target confirmation is not imported yet."],
  },
  nextAction: "Use the preview controls here, then connect the owned API for live evidence import.",
};

function shorten(value: string) {
  if (!value) return "missing";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function previewAllowlist(address: string): AllowlistMessage {
  return {
    status: "public-alpha",
    operatorWallets: [address || previewWallet],
    walletCount: 1,
    message: `GitCaster public alpha operator allowlist preview for ${address || previewWallet}`,
    messageHash: `preview-allowlist-${(address || previewWallet).slice(0, 12)}`,
    nextAction: "Connect the owned API to import a real allowlist signature.",
  };
}

async function previewSignature(message: string) {
  const bytes = new TextEncoder().encode(message);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `public-preview:${hash}`;
}

function previewImportResult(inputWritten = false): ImportResult {
  return {
    status: "public-alpha",
    verified: true,
    inputWritten,
    redacted: { signatureHash: "public-preview-signature" },
    nextAction: "Live import requires the owned CasterCloud API endpoint.",
  };
}

async function readJson<T>(route: string, init?: RequestInit): Promise<T> {
  if (publicPreviewMode) {
    throw new Error("Public preview mode is active. Connect the owned CasterCloud API to execute this endpoint.");
  }
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
    if (publicPreviewMode) {
      setApproval(previewApproval);
      setTargetHandoff(previewTargetHandoff);
      setTargetConfirmation(previewTargetConfirmation);
      setPublicConsoleEnv(previewPublicConsoleEnv);
      setCompletion(previewCompletion);
      return () => {
        cancelled = true;
      };
    }
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
    if (publicPreviewMode) {
      setCompletion(previewCompletion);
      if (!silent) setError("");
      return;
    }
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
    if (publicPreviewMode) {
      setAllowlist(previewAllowlist(address));
      return;
    }
    const route = `/v1/iam/operators/allowlist/message?wallet=${encodeURIComponent(address)}`;
    const json = await readJson<AllowlistMessage>(route);
    setAllowlist(json);
  }

  async function refreshPublicConsoleEnv() {
    if (publicPreviewMode) {
      setPublicConsoleEnv(previewPublicConsoleEnv);
      return;
    }
    const json = await readJson<PublicConsoleEnvStatus>("/v1/console/public-console-env");
    setPublicConsoleEnv(json);
  }

  async function submitPublicConsoleEnv(writeInput: boolean) {
    setBusy(writeInput ? "Staging endpoint env" : "Verifying endpoint env");
    setError("");
    try {
      if (publicPreviewMode) {
        const urls = [consolePublicBaseUrl, consoleApiBaseUrl, casterchainApiPublicBaseUrl];
        if (!urls.every((url) => /^https:\/\/[^ ]+\.[^ ]+/.test(url))) {
          throw new Error("Public URLs must be absolute https URLs.");
        }
        setPublicConsoleEnvResult(previewImportResult(false));
        setPublicConsoleEnv({
          ...previewPublicConsoleEnv,
          status: "public-alpha",
          nextAction: "URL shape verified locally. Live import waits for owned API evidence.",
        });
        return;
      }
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
    setBusy(publicPreviewMode ? "Starting preview operator" : "Connecting wallet");
    setError("");
    try {
      let selected = "";
      if (window.ethereum) {
        const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
        selected = accounts[0] || "";
      }
      if (!selected && !publicPreviewMode) throw new Error("Browser wallet not found");
      if (!selected) selected = previewWallet;
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
      if (!wallet || !allowlist?.message) throw new Error("Allowlist message is not ready");
      const signed =
        publicPreviewMode && (!window.ethereum || wallet === previewWallet)
          ? await previewSignature(allowlist.message)
          : ((await window.ethereum?.request({
              method: "personal_sign",
              params: [allowlist.message, wallet],
            })) as string);
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
      if (publicPreviewMode) {
        setAllowlistResult(previewImportResult(false));
        await refreshCompletion(true);
        return;
      }
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
      if (!wallet || !approval?.message) throw new Error("Approval message is not ready");
      const signed =
        publicPreviewMode && (!window.ethereum || wallet === previewWallet)
          ? await previewSignature(approval.message)
          : ((await window.ethereum?.request({
              method: "personal_sign",
              params: [approval.message, wallet],
            })) as string);
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
      if (publicPreviewMode) {
        setApprovalResult(previewImportResult(false));
        await refreshCompletion(true);
        return;
      }
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
      if (!wallet || !targetConfirmation?.message) throw new Error("Target confirmation message is not ready");
      const signed =
        publicPreviewMode && (!window.ethereum || wallet === previewWallet)
          ? await previewSignature(targetConfirmation.message)
          : ((await window.ethereum?.request({
              method: "personal_sign",
              params: [targetConfirmation.message, wallet],
            })) as string);
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
      if (publicPreviewMode) {
        setTargetConfirmationResult(previewImportResult(false));
        setTargetHandoff({ ...previewTargetHandoff, operatorInputPresent: true });
        await refreshCompletion(true);
        return;
      }
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
      if (publicPreviewMode) {
        setBundleResult(previewImportResult(false));
        setTargetHandoff({ ...previewTargetHandoff, operatorInputPresent: true });
        await refreshCompletion(true);
        return;
      }
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
          {publicPreviewMode ? "Start preview operator" : "Connect wallet"}
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
            {publicPreviewMode ? "Preview env check" : "Stage local env"}
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
