import { useEffect, useRef, useState } from "react";

const KEY = "mygem-window-v1";
const clamp = (n, min, max) => Math.max(min, Math.min(n, max));
export function fitWindow(rect, viewport) {
  const width = clamp(rect.width, Math.min(340, viewport.width - 16), viewport.width - 16);
  const height = clamp(rect.height, Math.min(420, viewport.height - 16), viewport.height - 16);
  return { width, height, x: clamp(rect.x, 8, viewport.width - width - 8), y: clamp(rect.y, 8, viewport.height - height - 8) };
}
export function resizeWindow(rect, edge, dx, dy, viewport) {
  const minW = Math.min(340, viewport.width - 16), minH = Math.min(420, viewport.height - 16);
  let left = rect.x, top = rect.y, right = left + rect.width, bottom = top + rect.height;
  if (edge.includes("w")) left = clamp(left + dx, 8, right - minW);
  if (edge.includes("e")) right = clamp(right + dx, left + minW, viewport.width - 8);
  if (edge.includes("n")) top = clamp(top + dy, 8, bottom - minH);
  if (edge.includes("s")) bottom = clamp(bottom + dy, top + minH, viewport.height - 8);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
function viewport() {
  return { width: window.visualViewport?.width || window.innerWidth, height: window.visualViewport?.height || window.innerHeight };
}
function defaults() { const v = viewport(); return fitWindow({ width: 440, height: 680, x: v.width - 464, y: v.height - 700 }, v); }
export function useChatWindow() {
  const [rect, setRect] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved && ["x", "y", "width", "height"].every(k => Number.isFinite(saved[k])) && saved.width > 0 && saved.height > 0) return saved; } catch { /* Storage is optional. */ }
    return defaults();
  });
  const [view, setView] = useState(viewport);
  const [expanded, setExpanded] = useState(false);
  const drag = useRef(null);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(rect)); } catch { /* Private browsing can disable storage. */ } }, [rect]);
  useEffect(() => {
    // A keyboard or temporary viewport reduction must not overwrite the user's layout.
    const update = () => { setView(viewport()); };
    window.addEventListener("resize", update); window.visualViewport?.addEventListener("resize", update);
    return () => { window.removeEventListener("resize", update); window.visualViewport?.removeEventListener("resize", update); };
  }, []);
  const mobile = view.width <= 600;
  const displayed = mobile ? { x: 8, y: expanded ? 8 : Math.max(8, view.height - 608), width: view.width - 16, height: expanded ? view.height - 16 : Math.min(600, view.height - 16) }
    : expanded ? { x: 8, y: 8, width: view.width - 16, height: view.height - 16 } : fitWindow(rect, view);
  function start(event, edge = "move") {
    if (mobile || expanded || event.button !== 0) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, rect: displayed, edge };
  }
  function move(event) {
    const d = drag.current; if (!d || d.id !== event.pointerId) return;
    const dx = event.clientX - d.x, dy = event.clientY - d.y;
    setRect(d.edge === "move" ? fitWindow({ ...d.rect, x: d.rect.x + dx, y: d.rect.y + dy }, viewport()) : resizeWindow(d.rect, d.edge, dx, dy, viewport()));
  }
  function keyboard(event, edge = "move") {
    if (mobile || expanded || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault(); const step = event.shiftKey ? 40 : 10;
    const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    setRect(r => { const visible = fitWindow(r, viewport()); return edge === "move" ? fitWindow({ ...visible, x: visible.x + dx, y: visible.y + dy }, viewport()) : resizeWindow(visible, edge, dx, dy, viewport()); });
  }
  return { style: { left: displayed.x, top: displayed.y, width: displayed.width, height: displayed.height, right: "auto", bottom: "auto" }, expanded, mobile,
    toggle: () => setExpanded(v => !v), reset: () => { setExpanded(false); setRect(defaults()); },
    handlers: (edge = "move") => ({ onPointerDown: e => start(e, edge), onPointerMove: move, onPointerUp: () => { drag.current = null; }, onPointerCancel: () => { drag.current = null; }, onLostPointerCapture: () => { drag.current = null; }, onKeyDown: e => keyboard(e, edge) }) };
}
