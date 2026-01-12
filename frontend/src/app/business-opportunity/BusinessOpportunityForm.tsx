"use client";

import { useState } from "react";
import { apiFetch, readBody, responseErrorMessage } from "@/lib/apiClient";

export default function BusinessOpportunityForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);

    try {
      const res = await apiFetch("/api/business-opportunity/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await readBody(res);
      if (!res.ok) throw new Error(responseErrorMessage(res, body));

      const json = body.json as { emailed?: boolean } | null;

      setResult(
        json?.emailed
          ? "Sent. Please check your inbox."
          : "Saved. Email sending is not configured yet on this server."
      );
      setEmail("");
    } catch (err: unknown) {
      setResult(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 rounded-lg border p-4" onSubmit={submit}>
      <h2 className="font-medium">Email this to me</h2>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          autoComplete="email"
        />
        <button
          className="rounded-md bg-foreground px-3 py-2 text-sm text-background transition-colors hover:bg-black/80 disabled:opacity-60 dark:hover:bg-white/80"
          disabled={busy}
          type="submit"
        >
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
      {result ? <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{result}</p> : null}
    </form>
  );
}
