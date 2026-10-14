// screens/ChatScreen.jsx (user-facing)
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useChat } from "../../hooks/useChat";
import { showErrorToast } from "../../components/common/CustomToast";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE_MB = 10;

function getFileIcon(mimeType) {
  if (IMAGE_TYPES.includes(mimeType)) return null;
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("word"))      return "DOC";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.includes("zip") || mimeType.includes("rar"))     return "ZIP";
  if (mimeType.includes("video"))     return "VID";
  if (mimeType.includes("audio"))     return "AUD";
  return "FILE";
}

function formatBytes(bytes) {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDateLabel(dateStr) {
  if (!dateStr) return null;
  const d    = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return null;
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeLabel(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ── Icons ──────────────────────────────────────────────────────────────────
function IconArrowLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconSend({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconPaperclip({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
    </svg>
  );
}

function IconX({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconWifi({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0114.08 0"/>
      <path d="M1.42 9a16 16 0 0121.16 0"/>
      <path d="M8.53 16.11a6 6 0 016.95 0"/>
      <circle cx="12" cy="20" r="1" fill="currentColor"/>
    </svg>
  );
}

function IconCheck({ size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconZoom({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function SingleTick() {
  return (
    <svg width="13" height="10" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-muted, #94a3b8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DoubleTick({ seen }) {
  return (
    <svg width="18" height="10" viewBox="0 0 30 24" fill="none"
      stroke={seen ? "var(--accent, #0d8f7a)" : "var(--text-muted, #94a3b8)"} strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 12 8 18 20 6" />
      <polyline points="10 12 16 18 28 6" />
    </svg>
  );
}

function UploadRing({ progress = 0, size = 36 }) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  const done = progress >= 100;

  return (
    <div style={{
      position: "absolute", inset: 0, borderRadius: 8,
      background: done ? "rgba(15,23,42,0.15)" : "rgba(15,23,42,0.42)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 0.3s ease",
    }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke="rgba(255,255,255,0.28)" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke="#ffffff" strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.25s ease" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          {done ? (
            <span style={{
              width: 16, height: 16, borderRadius: "50%", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--accent, #0d8f7a)",
            }}>
              <IconCheck size={9} />
            </span>
          ) : (
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
              {progress}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadBar({ progress = 0, light }) {
  return (
    <div style={{
      height: 3, width: "100%", borderRadius: 99, overflow: "hidden",
      background: light ? "rgba(255,255,255,0.28)" : "var(--border-default, #e2e8f0)",
      marginTop: 5,
    }}>
      <div style={{
        height: "100%", borderRadius: 99,
        width: `${Math.min(progress, 100)}%`,
        background: light ? "#ffffff" : "var(--accent, #0d8f7a)",
        transition: "width 0.25s ease",
      }} />
    </div>
  );
}

function Avatar({ name, size = 36, bg = "var(--brand-light, #e6f6f3)", color = "var(--accent, #0d8f7a)", src, online }) {
  const [imgError, setImgError] = useState(false);
  const initials = name?.charAt(0)?.toUpperCase() ?? "?";
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      {src && !imgError ? (
        <img src={src} alt={name} onError={() => setImgError(true)}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: bg, color,
          fontSize: Math.round(size * 0.38), fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center",
          letterSpacing: "-0.01em", fontFamily: "inherit",
        }}>
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span style={{
          position: "absolute", bottom: 1, right: 1,
          width: Math.round(size * 0.26), height: Math.round(size * 0.26),
          borderRadius: "50%", border: "2px solid var(--bg-surface, #ffffff)",
          background: online ? "#22c55e" : "var(--text-muted, #94a3b8)",
        }} />
      )}
    </div>
  );
}

function ImageLightbox({ src, name, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 4000,
        background: "rgba(15,23,42,0.86)", backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 40, cursor: "zoom-out",
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
        style={{
          position: "absolute", top: 20, right: 24,
          width: 38, height: 38, borderRadius: "50%", border: "none",
          background: "rgba(255,255,255,0.12)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <IconX size={16} />
      </button>
      <img
        src={src}
        alt={name ?? "attachment"}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "min(90vw, 900px)", maxHeight: "85vh",
          objectFit: "contain", borderRadius: 8,
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)", cursor: "default",
        }}
      />
      {name && (
        <div style={{
          position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)",
          fontSize: 12.5, fontWeight: 500, color: "rgba(255,255,255,0.85)",
          background: "rgba(0,0,0,0.35)", padding: "6px 14px", borderRadius: 999,
          maxWidth: "80vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {name}
        </div>
      )}
    </div>
  );
}

function AttachmentChip({ file, onRemove }) {
  const isImage = IMAGE_TYPES.includes(file.type);
  const label   = getFileIcon(file.type);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7,
      padding: "5px 8px 5px 6px", borderRadius: 10,
      background: "var(--bg-surface-hover, #f1f5f9)", border: "1px solid var(--border-default, #e2e8f0)",
      maxWidth: 180,
    }}>
      {isImage && preview ? (
        <img src={preview} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 30, height: 30, borderRadius: 6, flexShrink: 0,
          background: "var(--border-default, #e2e8f0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 8.5, fontWeight: 800, color: "var(--text-secondary, #475569)", letterSpacing: "0.04em",
        }}>
          {label}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-primary, #0f172a)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </p>
        <p style={{ fontSize: 10, color: "var(--text-muted, #94a3b8)", margin: 0 }}>{formatBytes(file.size)}</p>
      </div>
      <button onClick={() => onRemove(file)} style={{
        width: 18, height: 18, borderRadius: "50%", border: "none",
        background: "var(--border-default, #e2e8f0)", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0,
      }}>
        <IconX size={9} />
      </button>
    </div>
  );
}

// `isMine` replaces the back-office `isAdmin` — true when the message's
// sender_id matches the logged-in user's own id.
//
// NOTE on the white-on-white bug: every color below now carries a fallback
// via var(--token, fallback). If --bg-surface / --text-primary / etc. are
// ever undefined, unset, or resolve to a value that collides with the
// bubble background (e.g. a dark-mode value leaking into light mode), the
// bubble text used to render invisible instead of just looking "wrong".
// These fallbacks guarantee a bubble is never unreadable — but the real
// fix is still to check the theme file where these variables are declared
// and make sure --text-primary/--bg-surface resolve correctly per theme.
function MessageBubble({ msg, isMine, onImageClick }) {
  const rawStatus    = (msg.status ?? "").toLowerCase();
  const isOptimistic = typeof msg.id === "string" && msg.id.startsWith("temp_");
  const isSending    = isOptimistic || rawStatus === "sent";
  const isDelivered  = !isOptimistic && rawStatus === "delivered";
  const isSeen       = !isOptimistic && rawStatus === "seen";
  const ts           = msg.created_at ?? msg.send_time;
  const time         = timeLabel(ts);

  const usingLocalFiles = msg._localFiles && msg._localFiles.length > 0;
  const attachments = usingLocalFiles ? msg._localFiles : (msg.attachment ?? []);

  const allFilesUploaded = usingLocalFiles
    ? msg._localFiles.every(lf => (lf.progress ?? 0) >= 100)
    : true;
  const overallProgress = usingLocalFiles
    ? Math.round(msg._localFiles.reduce((sum, lf) => sum + (lf.progress ?? 0), 0) / msg._localFiles.length)
    : 100;

  return (
    <div style={{
      display: "flex", gap: 8,
      flexDirection: isMine ? "row-reverse" : "row",
      alignItems: "flex-end",
      paddingRight: isMine ? 0 : 56,
    }}>
      <div style={{
        display: "flex", flexDirection: "column", gap: 3,
        alignItems: isMine ? "flex-end" : "flex-start",
        maxWidth: "72%",
      }}>
        {attachments.length > 0 && (
          <div style={{
            display: "flex", flexDirection: "column", gap: 4,
            padding: "8px 10px",
            borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: isMine ? "var(--accent, #0d8f7a)" : "var(--bg-surface, #ffffff)",
            border: isMine ? "none" : "1px solid var(--border-subtle, #e2e8f0)",
            boxShadow: isMine ? "0 1px 4px rgba(13,143,122,0.18)" : "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            {attachments.map((att, i) => {
              const isImg = att.type?.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(att.url ?? "");
              const fileDone = usingLocalFiles && (att.progress ?? 0) >= 100;
              const clickable = isImg && (!usingLocalFiles || fileDone);
              const isUploading = usingLocalFiles && !fileDone;

              if (isImg) {
                return (
                  <div
                    key={i}
                    onClick={clickable ? () => onImageClick(att.url, att.name) : undefined}
                    style={{
                      position: "relative", borderRadius: 8, overflow: "hidden", lineHeight: 0,
                      cursor: clickable ? "zoom-in" : "default",
                    }}
                  >
                    <img src={att.url} alt={att.name ?? "attachment"}
                      style={{
                        maxWidth: 220, maxHeight: 180, objectFit: "cover", display: "block",
                        filter: usingLocalFiles && !fileDone ? "brightness(0.9)" : "none",
                      }} />
                    {clickable && (
                      <div style={{
                        position: "absolute", top: 6, right: 6,
                        width: 26, height: 26, borderRadius: 7,
                        background: "rgba(15,23,42,0.45)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <IconZoom size={16} />
                      </div>
                    )}
                    {usingLocalFiles && <UploadRing progress={att.progress ?? 0} />}
                  </div>
                );
              }

              // Non-image file (PDF, doc, zip, ...): show a spinner in the
              // icon slot + a live percentage while it's still uploading,
              // instead of just a static "PDF" badge that looks identical
              // whether the file is done or not.
              return (
                <a key={i} href={usingLocalFiles ? undefined : att.url} target="_blank" rel="noreferrer"
                  onClick={usingLocalFiles ? (e) => e.preventDefault() : undefined}
                  style={{
                    display: "flex", flexDirection: "column", gap: 0,
                    padding: "7px 10px", borderRadius: 8,
                    background: isMine ? "rgba(255,255,255,0.15)" : "var(--bg-surface-hover, #f1f5f9)",
                    textDecoration: "none",
                    cursor: usingLocalFiles ? "default" : "pointer",
                    opacity: isUploading ? 0.85 : 1,
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.04em",
                      color: isMine ? "#fff" : "var(--text-secondary, #475569)",
                      background: isMine ? "rgba(255,255,255,0.2)" : "var(--border-default, #e2e8f0)",
                      padding: "2px 5px", borderRadius: 4,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      minWidth: 22, minHeight: 16,
                    }}>
                      {isUploading ? (
                        <span style={{
                          width: 9, height: 9, borderRadius: "50%",
                          border: `1.5px solid ${isMine ? "rgba(255,255,255,0.35)" : "var(--border-subtle, #e2e8f0)"}`,
                          borderTopColor: isMine ? "#fff" : "var(--accent, #0d8f7a)",
                          display: "inline-block",
                          animation: "spin 0.7s linear infinite",
                        }} />
                      ) : fileDone && usingLocalFiles ? (
                        <IconCheck size={9} />
                      ) : (
                        getFileIcon(att.type ?? "")
                      )}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: isMine ? "#fff" : "var(--text-primary, #0f172a)" }}>
                      {att.name ?? "File"}
                    </span>
                    {isUploading && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, marginLeft: "auto", flexShrink: 0,
                        color: isMine ? "rgba(255,255,255,0.85)" : "var(--text-muted, #94a3b8)",
                      }}>
                        {att.progress ?? 0}%
                      </span>
                    )}
                  </div>
                  {isUploading && (
                    <UploadBar progress={att.progress ?? 0} light={isMine} />
                  )}
                </a>
              );
            })}
          </div>
        )}
        {msg.content && (
          <div style={{
            padding: "9px 14px",
            borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: isMine ? "var(--accent, #0d8f7a)" : "var(--bg-surface, #ffffff)",
            color: isMine ? "#fff" : "var(--text-primary, #0f172a)",
            fontSize: 13.5, lineHeight: 1.6,
            boxShadow: isMine ? "0 1px 4px rgba(13,143,122,0.18)" : "0 1px 3px rgba(0,0,0,0.06)",
            border: isMine ? "none" : "1px solid var(--border-subtle, #e2e8f0)",
            opacity: isSending ? 0.6 : 1,
            wordBreak: "break-word",
          }}>
            {msg.content}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexDirection: isMine ? "row-reverse" : "row" }}>
          {usingLocalFiles && !allFilesUploaded ? (
            <span style={{ fontSize: 10.5, color: "var(--accent, #0d8f7a)", fontWeight: 600 }}>
              Uploading {overallProgress}%
            </span>
          ) : (
            <span style={{ fontSize: 10.5, color: "var(--text-muted, #94a3b8)", letterSpacing: "0.01em" }}>{time}</span>
          )}
          {isMine && !(usingLocalFiles && !allFilesUploaded) && (
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              {isSending   && <SingleTick />}
              {isDelivered && <DoubleTick seen={false} />}
              {isSeen      && <DoubleTick seen={true} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DateDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0 12px" }}>
      <div style={{ flex: 1, height: "1px", background: "var(--border-subtle, #e2e8f0)" }} />
      <span style={{ fontSize: 10.5, color: "var(--text-muted, #94a3b8)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "1px", background: "var(--border-subtle, #e2e8f0)" }} />
    </div>
  );
}

function SystemMessage({ text }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
      <span style={{
        fontSize: 11, color: "var(--text-muted, #94a3b8)", padding: "4px 14px",
        background: "var(--bg-surface-hover, #f1f5f9)", borderRadius: 999, fontWeight: 500, letterSpacing: "0.01em",
      }}>
        {text}
      </span>
    </div>
  );
}

// Floating typing pill — absolutely positioned over the message list, just
// above the input bar, so it never shifts the message flow or forces a
// scroll when it appears/disappears. Rendered as a sibling of the scroll
// container, not inside it. The scroll container itself adds matching
// bottom padding while this is visible (see `scrollBottomPadding` below)
// so the pill floats in that reserved gap instead of covering the last
// bubble.
function FloatingTypingIndicator({ userInfo }) {
  return (
    <div className="typing-float">
      <Avatar name={userInfo?.name ?? "U"} size={24} bg="var(--bg-surface-hover, #f1f5f9)" color="var(--text-secondary, #475569)" src={userInfo?.image} />
      <div className="typing-float-dots">
        <span style={{ animationDelay: "0s" }} />
        <span style={{ animationDelay: "0.18s" }} />
        <span style={{ animationDelay: "0.36s" }} />
      </div>
    </div>
  );
}

function Spinner({ size = 28, color = "var(--accent, #0d8f7a)" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2.5px solid var(--border-default, #e2e8f0)`, borderTopColor: color,
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

const GLOBAL_STYLES = `
  @keyframes typingBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
    40%           { transform: translateY(-4px); opacity: 1; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes typingFloatIn {
    from { opacity: 0; transform: translateY(6px) scale(0.94); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .typing-float {
    position: absolute;
    left: 24px;
    bottom: 14px;
    z-index: 5;
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px 6px 6px;
    border-radius: 999px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border-subtle, #e2e8f0);
    box-shadow: 0 6px 18px rgba(15,23,42,0.12);
    animation: typingFloatIn 0.18s ease both;
    pointer-events: none;
  }
  .typing-float-dots { display: flex; align-items: center; gap: 3px; }
  .typing-float-dots span {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--text-muted, #94a3b8);
    display: inline-block;
    animation: typingBounce 1.1s infinite ease-in-out;
  }

  .chat-textarea {
    flex: 1; border-radius: 12px; border: 1.5px solid var(--border-default, #e2e8f0);
    padding: 10px 14px; font-size: 13.5px; font-family: inherit;
    color: var(--text-primary, #0f172a); background: var(--bg-page, #f8fafc);
    resize: none; outline: none; line-height: 1.55; box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .chat-textarea::placeholder { color: var(--text-muted, #94a3b8); }
  .chat-textarea:focus {
    border-color: var(--accent, #0d8f7a); background: var(--bg-surface, #ffffff);
    box-shadow: 0 0 0 3px rgba(13,143,122,0.09);
  }
  .chat-textarea:disabled {
    background: var(--bg-surface-hover, #f1f5f9); color: var(--text-muted, #94a3b8);
    cursor: not-allowed; border-color: var(--border-default, #e2e8f0);
  }

  .send-btn {
    width: 40px; height: 40px; border-radius: 12px; border: none;
    background: var(--accent, #0d8f7a); display: flex; align-items: center;
    justify-content: center; cursor: pointer; flex-shrink: 0;
    transition: opacity 0.15s;
    box-shadow: 0 2px 8px rgba(13,143,122,0.25);
  }
  .send-btn:hover:not(:disabled) { opacity: 0.9; }
  .send-btn:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

  .attach-btn {
    width: 40px; height: 40px; border-radius: 12px;
    border: 1.5px solid var(--border-default, #e2e8f0); background: var(--bg-page, #f8fafc);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; color: var(--text-secondary, #475569);
    transition: border-color 0.15s, background 0.15s, color 0.15s;
  }
  .attach-btn:hover:not(:disabled) { border-color: var(--accent, #0d8f7a); background: var(--brand-light, #e6f6f3); color: var(--accent, #0d8f7a); }
  .attach-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .attach-btn.has-files { border-color: var(--accent, #0d8f7a); background: var(--brand-light, #e6f6f3); color: var(--accent, #0d8f7a); }

  .back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    color: var(--text-secondary, #475569); font-size: 12.5px; font-weight: 500;
    padding: 5px 8px; border-radius: 8px; font-family: inherit;
    transition: color 0.15s, background 0.15s; white-space: nowrap;
  }
  .back-btn:hover { color: var(--text-primary, #0f172a); background: var(--bg-surface-hover, #f1f5f9); }

  .msg-scroll { transition: padding-bottom 0.15s ease; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-default, #e2e8f0); border-radius: 99px; }
`;

// ── ChatScreen ─────────────────────────────────────────────────────────────
// Route shape assumed: /chat/:id?user={otherUserId}&name=&email=&image=
// where :id is the order/travel id used only to seed the URL — the actual
// conversation is created against `user` (the other party) via startConversation.
export default function ChatScreen() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  const userIdFromParam = searchParams.get("user");
  const receiverId = userIdFromParam ? Number(userIdFromParam) : null;

  const {
    messages,
    hasConversation,
    isClosed,
    starting,
    connected,
    isUserTyping,
    uploadingAttachment,
    onlineUserIds,
    startError,
    clearStartError,
    startConversation,
    sendMessage,
    sendMessageWithAttachments,
    sendTyping,
    sendTypingStop,
    currentUserId,
  } = useChat(receiverId);

  const [text,          setText]          = useState("");
  const [attachments,   setAttachments]   = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null); // { url, name } | null
  const typingStopTimerRef = useRef(null);
  const bottomRef          = useRef(null);
  const scrollRef          = useRef(null);
  const autoStartedRef     = useRef(false);
  const fileInputRef       = useRef(null);

  useEffect(() => {
    if (!receiverId || autoStartedRef.current) return;
    autoStartedRef.current = true;
    startConversation();
  }, [receiverId]);

  useEffect(() => {
    if (!startError) return;
    showErrorToast("Can't open this chat", startError);
    clearStartError();
  }, [startError]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isUserTyping]);

  useEffect(() => {
    if (hasConversation && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [hasConversation]);

  useEffect(() => () => clearTimeout(typingStopTimerRef.current), []);

  const handleAttachClick = () => { if (isClosed) return; fileInputRef.current?.click(); };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files ?? []);
    const valid = [];
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showWarningToast("File too large", `"${f.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit`);
        continue;
      }
      valid.push(f);
    }
    setAttachments(prev => [...prev, ...valid]);
    e.target.value = "";
  };

  const handleRemoveAttachment = (file) => setAttachments(prev => prev.filter(f => f !== file));
  const handleImageClick = (url, name) => setLightboxImage({ url, name });
  const handleCloseLightbox = () => setLightboxImage(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    clearTimeout(typingStopTimerRef.current);
    sendTypingStop();

    setText("");
    const filesToSend = attachments;
    setAttachments([]);

    try {
      if (filesToSend.length > 0) {
        await sendMessageWithAttachments(trimmed, filesToSend);
      } else {
        sendMessage(trimmed);
      }
    } catch (err) {
      showErrorToast("Failed to send message", "Please check your connection and try again.");
      setText(trimmed);
      setAttachments(filesToSend);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    sendTyping();
    clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => sendTypingStop(), 2000);
  };

  if (!receiverId) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, background: "var(--bg-page, #f8fafc)" }}>
        <style>{GLOBAL_STYLES}</style>
        <p style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", margin: 0, fontWeight: 500 }}>No conversation selected.</p>
      </div>
    );
  }

  const nameFromParam  = searchParams.get("name")  ? decodeURIComponent(searchParams.get("name"))  : null;
  const emailFromParam = searchParams.get("email") ? decodeURIComponent(searchParams.get("email")) : null;
  const imageFromParam = searchParams.get("image") ? decodeURIComponent(searchParams.get("image")) : null;
  const urlFallbackUser = nameFromParam ? { name: nameFromParam, email: emailFromParam, image: imageFromParam } : null;

  const userInfo = messages.find(m => m.other_user)?.other_user ?? urlFallbackUser ?? null;

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !isClosed && !uploadingAttachment;

  // Whether the other party is online, per the server's presence_snapshot /
  // user_online / user_offline events — separate from `connected`, which is
  // only about our own socket. Falls back to an empty Set if the hook
  // hasn't been updated with presence support yet, so this never crashes.
  const isReceiverOnline = receiverId != null && !!(onlineUserIds ?? new Set()).has(receiverId);

  const rendered = [];
  let lastDateLabel = null;

  messages.forEach((msg, i) => {
    if (msg.type === "system") {
      rendered.push({ type: "system", msg, key: `sys_${i}` });
      return;
    }
    const ts           = msg.created_at ?? msg.send_time;
    const isOptimistic = typeof msg.id === "string" && msg.id.startsWith("temp_");
    const label        = !isOptimistic ? getDateLabel(ts) : null;
    if (label && label !== lastDateLabel) {
      rendered.push({ type: "date", label, key: `date_${i}` });
      lastDateLabel = label;
    }
    // "Mine" = sender_id matches the logged-in user's own id (from
    // localStorage user_id, exposed as currentUserId by useChat).
    const isMine = isOptimistic || msg.sender_id === currentUserId;
    rendered.push({ type: "msg", msg, isMine, key: msg.id ?? `msg_${i}` });
  });

  return (
    <div style={{ width: "100%", height: "100%", background: "var(--bg-page, #f8fafc)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{GLOBAL_STYLES}</style>
      <ImageLightbox src={lightboxImage?.url} name={lightboxImage?.name} onClose={handleCloseLightbox} />

      <input
        ref={fileInputRef} type="file" multiple
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.mp4,.mp3"
        style={{ display: "none" }} onChange={handleFileChange}
      />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{
          flex: 1, background: "var(--bg-surface, #ffffff)", display: "flex", flexDirection: "column",
          overflow: "hidden", minWidth: 0,
        }}>
          {/* Header */}
          <div style={{
            padding: "0 20px", height: 64, borderBottom: "1px solid var(--border-subtle, #e2e8f0)",
            display: "flex", alignItems: "center", gap: 12,
            background: "var(--bg-surface, #ffffff)", flexShrink: 0,
          }}>
            <button className="back-btn" onClick={() => navigate(-1)}>
              <IconArrowLeft size={14} /> Back
            </button>
            <div style={{ width: 1, height: 20, background: "var(--border-default, #e2e8f0)", flexShrink: 0 }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <Avatar name={userInfo?.name ?? "U"} src={userInfo?.image} size={36} online={isReceiverOnline} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary, #0f172a)", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userInfo?.name ?? "User"}
                </p>
                <p style={{
                  fontSize: 11, margin: 0, fontWeight: 500,
                  color: isUserTyping ? "var(--accent, #0d8f7a)" : isReceiverOnline ? "#16a34a" : "var(--text-muted, #94a3b8)",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {isUserTyping ? (
                    <>Typing…</>
                  ) : isReceiverOnline ? (
                    <><span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />Online</>
                  ) : (
                    <><span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "var(--text-muted, #94a3b8)" }} />Offline</>
                  )}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 12px", borderRadius: 999,
              background: connected ? "#f0fdf4" : "#fff8f1",
              border: `1px solid ${connected ? "#bbf7d0" : "#fed7aa"}`, flexShrink: 0 }}>
              <span style={{ color: connected ? "#16a34a" : "#ea580c", display: "flex", alignItems: "center" }}>
                <IconWifi size={13} />
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: connected ? "#166534" : "#9a3412" }}>
                {connected ? "Connected" : "Reconnecting…"}
              </span>
            </div>
          </div>

          {/* Messages area — wrapped so the floating typing pill can anchor
              to the bottom of THIS box (i.e. right above the input bar)
              instead of the whole panel, regardless of input bar height.
              While the pill is showing, the scroll container reserves a
              matching bottom gap (`msg-scroll` + inline paddingBottom
              below) so the pill floats in that empty space instead of
              sitting on top of the last bubble. */}
          <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div
            ref={scrollRef}
            className="msg-scroll"
            style={{
              padding: "16px 24px",
              paddingBottom: isUserTyping ? 56 : 16,
              flex: 1, overflowY: "auto",
              display: "flex", flexDirection: "column", gap: 0,
              background: "var(--bg-page, #f8fafc)", minHeight: 0,
            }}
          >
            {starting ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 48 }}>
                <Spinner size={26} />
                <p style={{ fontSize: 12, color: "var(--text-muted, #94a3b8)", margin: 0 }}>Starting conversation…</p>
              </div>
            ) : (
              <>
                <SystemMessage text="Conversation started" />
                {rendered.map((item) => {
                  if (item.type === "date")   return <DateDivider key={item.key} label={item.label} />;
                  if (item.type === "system") return <SystemMessage key={item.key} text={item.msg.content} />;
                  return (
                    <div key={item.key} style={{ marginTop: 8 }}>
                      <MessageBubble
                        msg={item.msg}
                        isMine={item.isMine}
                        onImageClick={handleImageClick}
                      />
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>
          {isUserTyping && <FloatingTypingIndicator userInfo={userInfo} />}
          </div>

          {/* Input area */}
          <div style={{ borderTop: "1px solid var(--border-subtle, #e2e8f0)", background: "var(--bg-surface, #ffffff)", flexShrink: 0 }}>
            {attachments.length > 0 && (
              <div style={{ padding: "10px 16px 0", display: "flex", flexWrap: "wrap", gap: 8 }}>
                {attachments.map((file, i) => (
                  <AttachmentChip key={`${file.name}_${i}`} file={file} onRemove={handleRemoveAttachment} />
                ))}
              </div>
            )}
            <div style={{ padding: "12px 16px", display: "flex", gap: 8, alignItems: "flex-end" }}>
              <button className={`attach-btn${attachments.length > 0 ? " has-files" : ""}`} onClick={handleAttachClick} disabled={isClosed} title="Attach files">
                <IconPaperclip size={16} />
              </button>
              <textarea
                className="chat-textarea" value={text}
                onChange={handleTextChange} onKeyDown={handleKeyDown}
                placeholder={isClosed ? "This chat has been deactivated" : "Write a message… (Enter to send)"}
                disabled={isClosed} rows={1}
              />
              <button className="send-btn" onClick={handleSend} disabled={!canSend} aria-label="Send message">
                {uploadingAttachment ? <Spinner size={15} color="#fff" /> : <IconSend size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}