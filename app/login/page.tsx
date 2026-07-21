"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/session", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({accessToken})});
      const data = (await response.json()) as {error?: string};
      if (!response.ok) throw new Error(data.error ?? "Could not sign in.");
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in.");
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-6 py-12">
      <form className="w-full rounded-3xl border-2 border-[#171717] bg-white p-7 shadow-[7px_7px_0_#2f80ed]" onSubmit={submit}>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2f80ed]">Private studio</p>
        <h1 className="mt-3 text-3xl font-black">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-[#4a4a4a]">Use the private studio access token configured for this deployment.</p>
        <label className="mt-6 block text-sm font-bold">Studio access token
          <input autoComplete="current-password" className="mt-2 w-full rounded-xl border-2 border-[#171717] px-4 py-3 outline-none focus:border-[#2f80ed]" onChange={(event) => setAccessToken(event.target.value)} required type="password" value={accessToken} />
        </label>
        {error ? <p className="mt-4 rounded-xl bg-[#fff3f3] p-3 text-sm font-semibold text-[#a82727]">{error}</p> : null}
        <button className="mt-6 w-full rounded-full bg-[#171717] px-5 py-3 font-bold text-white disabled:opacity-60" disabled={loading} type="submit">{loading ? "Signing in…" : "Enter studio"}</button>
      </form>
    </main>
  );
}
