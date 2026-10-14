import { redirect } from "next/navigation";

export const instant = false;

/** better-auth mengirim link verifikasi ke /verify-email?token=... — redirect ke /verifikasi. */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; callbackURL?: string }>;
}) {
  const { token, callbackURL } = await searchParams;
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (callbackURL) params.set("callbackURL", callbackURL);
  const qs = params.toString();
  redirect(`/verifikasi${qs ? `?${qs}` : ""}`);
}
