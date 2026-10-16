import { useState, useRef, useEffect, useMemo } from "react";

/**
 * Dropdown with a search bar. The menu opens directly BELOW the button.
 *
 * options: [{ value, label, search? , ...anything else you want in renderOption }]
 *   - `search` (optional) is extra text to match on; label is always searched.
 * renderButton(selectedOption) / renderOption(option) are optional custom renderers.
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  loading = false,
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "w-full",
  renderButton,
  renderOption,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Focus the search box when the menu opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.label ?? ""} ${o.search ?? ""}`.toLowerCase().includes(q)
    );
  }, [options, query]);

  const handlePick = (option) => {
    onChange(option.value);
    close();
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => (open ? close() : setOpen(true))}
        className={`${buttonClassName} flex items-center justify-between gap-2 text-left disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <span className="truncate flex items-center gap-2 min-w-0">
          {loading
            ? "Loading…"
            : selected
            ? renderButton
              ? renderButton(selected)
              : selected.label
            : <span className="text-gray-300">{placeholder}</span>}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden ${menuClassName}`}
        >
          {/* Search bar */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#0d8f7a] focus:ring-2 focus:ring-[#0d8f7a]/20 placeholder-gray-300"
              />
            </div>
          </div>

          {/* Options */}
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">{emptyText}</li>
            ) : (
              filtered.map((o) => {
                const isSelected = o.value === value;
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => handlePick(o)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors hover:bg-gray-50 ${
                        isSelected ? "bg-[#0d8f7a]/10 text-[#0d8f7a] font-semibold" : "text-gray-700"
                      }`}
                    >
                      {renderOption ? renderOption(o) : o.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}