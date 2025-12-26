export async function hashPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<string> {
  const encoder = new TextEncoder();
  const tokenSalt = email.trim().toLowerCase() + ":" + password;
  const data = encoder.encode(tokenSalt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(
  data: { email: string; password: string },
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(data);
  return passwordHash === hash;
}
