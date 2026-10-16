// Multi-account support: keeps every logged-in user in localStorage and
// mirrors the ACTIVE one into the old keys (token, user_name, user_email,
// user_id) so your existing axios/auth code keeps working unchanged.

const ACCOUNTS_KEY = "accounts";          // [{ id, name, email, token }]
const ACTIVE_KEY   = "active_user_id";

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const write = (list) => localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));

// Copy the active account into the legacy keys the rest of the app reads.
const syncLegacyKeys = (account) => {
  if (!account) {
    ["token", "user_name", "user_email", "user_id"].forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem(ACTIVE_KEY);
    return;
  }
  localStorage.setItem("token", account.token);
  localStorage.setItem("user_name", account.name || "");
  localStorage.setItem("user_email", account.email || "");
  localStorage.setItem("user_id", String(account.id ?? ""));
  localStorage.setItem(ACTIVE_KEY, String(account.id));
};

export const getAccounts = () => read();

export const getActiveAccount = () => {
  const activeId = localStorage.getItem(ACTIVE_KEY);
  return read().find((a) => String(a.id) === activeId) ?? null;
};

/** Call after a successful login. Adds (or updates) the account and makes it active. */
export const saveAccount = ({ id, name, email, token }) => {
  const account = { id: String(id), name, email, token };
  const list = read().filter((a) => a.id !== account.id);
  write([...list, account]);
  syncLegacyKeys(account);
  return account;
};

/** Switch to another saved account. Returns true if it existed. */
export const switchAccount = (id) => {
  const account = read().find((a) => a.id === String(id));
  if (!account) return false;
  syncLegacyKeys(account);
  return true;
};

/**
 * Log one account out. If it was the active one, falls back to another saved
 * account. Returns the account that is now active, or null if none are left.
 */
export const removeAccount = (id) => {
  const list = read().filter((a) => a.id !== String(id));
  write(list);

  const activeId = localStorage.getItem(ACTIVE_KEY);
  if (activeId === String(id)) {
    const next = list[0] ?? null;
    syncLegacyKeys(next);
    return next;
  }
  return getActiveAccount();
};

export const clearAllAccounts = () => {
  localStorage.removeItem(ACCOUNTS_KEY);
  syncLegacyKeys(null);
};