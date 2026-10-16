import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useNotificationCount } from "../../context/NotificationCountContext"; // NEW
import { useFcmListener } from "../../hooks/useFcmListener"; // NEW (adjust path if different)
import {
  getAccounts,
  saveAccount,
  switchAccount,
  removeAccount,
} from "../../utlls/Accounts";

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const navGroups = [
  {
    label: "Main",
    items: [
      {
        label: "Home",
        path: "/home",
        icon: (
          <svg {...iconProps}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        label: "Offers",
        path: "/offers",
        icon: (
          <svg {...iconProps}>
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Activity",
    items: [
      {
        label: "My Orders",
        path: "/my-orders",
        icon: (
          <svg {...iconProps}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        ),
      },
      {
        label: "My Travels",
        path: "/my-travels",
        icon: (
          <svg {...iconProps}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        ),
      },
      {
        label: "Chat",
        path: "/chat",
        icon: (
          <svg {...iconProps}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        ),
      },
      // NEW
      {
        label: "Notifications",
        path: "/notifications",
        icon: (
          <svg {...iconProps}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        ),
      },
    ],
  },
];

const getInitials = (name) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "GU";

// Users who were already logged in before multi-account support existed only
// have the old localStorage keys. Save them into the accounts list once, so
// they show up in the switcher.
const ensureCurrentAccountSaved = () => {
  const token = localStorage.getItem("token");
  if (token && getAccounts().length === 0) {
    saveAccount({
      id: localStorage.getItem("user_id") || "current",
      name: localStorage.getItem("user_name") || "",
      email: localStorage.getItem("user_email") || "",
      token,
    });
  }
};

export default function UserLayout() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  // On mobile this still toggles a drawer; on lg+ the sidebar ignores this and stays open
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, forceRender] = useState(0); // re-render after removing a saved account
  const { theme, toggleTheme } = useTheme();

  // NEW: push notifications (foreground toast, sound, token sync) + unread badge.
  // Requires <NotificationCountProvider> to wrap this layout higher up.
  useFcmListener();
  const { count } = useNotificationCount(); // use the name your context exposes (count / unreadCount)

  ensureCurrentAccountSaved();

  const userName = localStorage.getItem("user_name") || "GrabnGo User";
  const userEmail = localStorage.getItem("user_email") || "";
  const activeId = localStorage.getItem("active_user_id");

  const userInitials = getInitials(userName);

  // Other saved accounts (everyone except the active user)
  const otherAccounts = getAccounts().filter((a) => a.id !== activeId);

  // Full page reload on purpose: it resets the chat socket, presence and any
  // cached data that belonged to the previous user.
  const handleSwitch = (id) => {
    if (switchAccount(id)) window.location.href = "/home";
  };

  const handleRemoveOther = (e, id) => {
    e.stopPropagation();
    removeAccount(id);
    forceRender((n) => n + 1);
  };

  const handleAddAccount = () => {
    setShowDropdown(false);
    navigate("/"); // login screen — the new login is added to the saved list
  };

  // Logs out only the active user. If other accounts are saved, switch to one.
  const handleLogout = () => {
    const next = removeAccount(activeId);
    window.location.href = next ? "/home" : "/";
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: "var(--bg-page)", fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Top Navbar */}
      <header
        className="flex items-center justify-between px-3 sm:px-6 text-white z-10 flex-shrink-0"
        style={{ background: "var(--brand)", height: "60px" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger — only needed on mobile now since sidebar is always visible on lg+ */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/90 hover:text-white transition-colors flex-shrink-0 lg:hidden"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Brand */}
          <Link to="/home" className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight truncate">GrabnGo</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {/* Create Order CTA */}
          <Link
            to="/create-order"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors"
            style={{ background: "rgba(255,255,255,0.18)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Create Order</span>
          </Link>

          <Link
            to="/create-travel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors"
            style={{ background: "rgba(255,255,255,0.18)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="hidden sm:inline">Create Travel</span>
          </Link>

          {/* NEW: Notifications bell with unread badge */}
          <Link
            to="/notifications"
            className="relative text-white/80 hover:text-white transition-colors"
            aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {count > 0 && (
              <span
                className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "var(--danger, #ef4444)", color: "#fff" }}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === "light" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {userInitials}
              </div>
              <span className="hidden sm:inline text-sm font-semibold">{userName}</span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="hidden sm:inline"
                style={{ transition: "transform 0.2s", transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showDropdown && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 10 }}
                  onClick={() => setShowDropdown(false)}
                />
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0,
                    background: "var(--bg-surface)", borderRadius: 12,
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    minWidth: 260, zIndex: 20, overflow: "hidden",
                  }}
                >
                  {/* Active user */}
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{userName}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>{userEmail || "GrabnGo User"}</p>
                  </div>

                  {/* Other saved accounts — click to switch */}
                  {otherAccounts.length > 0 && (
                    <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <p
                        style={{
                          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em",
                          textTransform: "uppercase", color: "var(--text-muted)",
                          margin: 0, padding: "10px 16px 4px",
                        }}
                      >
                        Switch account
                      </p>
                      <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        {otherAccounts.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => handleSwitch(a.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "8px 16px", cursor: "pointer",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-light)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <div
                              style={{
                                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                                background: "var(--brand-light)", color: "var(--brand)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 800,
                              }}
                            >
                              {getInitials(a.name || a.email)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {a.name || "GrabnGo User"}
                              </p>
                              <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {a.email}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleRemoveOther(e, a.id)}
                              title="Remove this account"
                              aria-label={`Remove ${a.name || a.email}`}
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "var(--text-muted)", fontSize: 18, lineHeight: 1, padding: 2,
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add another account */}
                  <button
                    onClick={handleAddAccount}
                    style={{
                      width: "100%", padding: "10px 16px",
                      display: "flex", alignItems: "center", gap: 8,
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 14, fontWeight: 600, color: "var(--text-primary)", textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-light)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    Add another account
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/profile");
                    }}
                    style={{
                      width: "100%", padding: "10px 16px",
                      display: "flex", alignItems: "center", gap: 8,
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 14, fontWeight: 600, color: "var(--text-primary)", textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-light)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile
                  </button>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%", padding: "10px 16px",
                      display: "flex", alignItems: "center", gap: 8,
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 14, fontWeight: 600, color: "var(--danger)", textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--danger-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Main */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay only makes sense on mobile — hidden on lg since sidebar is static there */}
        {sidebarOpen && (
          <div
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          />
        )}

        {/* Sidebar — drawer on mobile, permanently visible + static on lg+ */}
        <aside
          className={`w-64 sm:w-56 flex flex-col py-4 flex-shrink-0 overflow-y-auto
            fixed inset-y-0 left-0 z-40
            transition-transform duration-200 ease-in-out
            lg:static lg:translate-x-0 lg:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)" }}
        >
          {/* Close button — only relevant on mobile now */}
          <div className="flex items-center justify-between px-5 mb-4">
            <span style={{ color: "var(--text-primary)" }} className="font-semibold text-xl">GrabnGo</span>
            <button
              onClick={closeSidebar}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Nav Groups */}
          <nav className="flex flex-col flex-1">
            {navGroups.map((group, gi) => (
              <div key={group.label} style={{ marginBottom: 6 }}>
                <p
                  style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--text-muted)",
                    margin: "0 0 2px", padding: "0 20px",
                  }}
                >
                  {group.label}
                </p>

                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 mx-3 rounded-xl text-sm font-semibold transition-all
                        ${isActive ? "" : "hover:opacity-80"}`
                      }
                      style={({ isActive }) => ({
                        background: isActive ? "var(--brand-light)" : "transparent",
                        color: isActive ? "var(--brand)" : "var(--text-secondary)",
                      })}
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {/* NEW: unread badge next to the Notifications link */}
                      {item.path === "/notifications" && count > 0 && (
                        <span
                          className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                          style={{ background: "var(--danger, #ef4444)", color: "#fff" }}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>

                {gi < navGroups.length - 1 && (
                  <div style={{ height: 1, background: "var(--border-subtle)", margin: "8px 16px" }} />
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: "var(--bg-page)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}