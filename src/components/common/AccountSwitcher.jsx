import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAccounts,
  getActiveAccount,
  switchAccount,
  removeAccount,
} from "../../utils/accounts";

const initial = (a) => (a?.name || a?.email || "?").charAt(0).toUpperCase();

function Avatar({ account, size = 34 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: "var(--brand)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.42, fontWeight: 800,
      }}
    >
      {initial(account)}
    </div>
  );
}

/**
 * Profile button + dropdown that lists every logged-in account.
 * Drop it into the UserLayout navbar in place of the current profile dropdown
 * (keep your theme toggle etc. as they are).
 */
export default function AccountSwitcher() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [, force] = useState(0); // re-render after removing an account
  const wrapRef = useRef(null);

  const accounts = getAccounts();
  const active = getActiveAccount();

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Full reload on purpose: resets chat sockets, presence and any cached data
  // that belonged to the previous user.
  const handleSwitch = (id) => {
    if (switchAccount(id)) window.location.href = "/home";
  };

  const handleRemoveOther = (e, id) => {
    e.stopPropagation();
    removeAccount(id);
    force((n) => n + 1);
  };

  const handleLogout = () => {
    const next = removeAccount(active?.id);
    window.location.href = next ? "/home" : "/";
  };

  const handleAdd = () => {
    setOpen(false);
    navigate("/"); // login screen; the new login is added to the list
  };

  const menuItem = {
    width: "100%", textAlign: "left", background: "none", border: "none",
    padding: "10px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
    color: "var(--text-primary)", fontFamily: "inherit",
    display: "flex", alignItems: "center", gap: 10,
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          background: "none", border: "none", padding: 4, borderRadius: 999,
          fontFamily: "inherit",
        }}
        aria-label="Switch account"
      >
        <Avatar account={active} />
        <span
          className="hidden sm:block"
          style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {active?.name || "Account"}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Menu */}
      {open && (
        <div
          style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 60,
            width: 290, background: "var(--bg-surface)",
            border: "1px solid var(--border-default)", borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.14)", overflow: "hidden",
          }}
        >
          <p style={{ margin: 0, padding: "12px 14px 6px", fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Accounts
          </p>

          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {accounts.map((a) => {
              const isActive = a.id === active?.id;
              return (
                <div
                  key={a.id}
                  onClick={() => !isActive && handleSwitch(a.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
                    cursor: isActive ? "default" : "pointer",
                    background: isActive ? "var(--bg-surface-hover)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-surface-hover)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <Avatar account={a} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.name || "User"}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.email}
                    </p>
                  </div>
                  {isActive ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <button
                      onClick={(e) => handleRemoveOther(e, a.id)}
                      title="Remove this account"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18, lineHeight: 1, padding: 2 }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ height: 1, background: "var(--border-subtle)" }} />

          <button style={menuItem} onClick={handleAdd}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
            <span style={{ color: "var(--brand)", fontSize: 18, lineHeight: 1 }}>+</span>
            Add another account
          </button>
          <button style={menuItem} onClick={() => { setOpen(false); navigate("/profile"); }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
            My profile
          </button>
          <button style={{ ...menuItem, color: "var(--danger, #ef4444)" }} onClick={handleLogout}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}