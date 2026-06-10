/* PlaySputnik Session Module — play-session tracking with idle detection and smart continuity */
"use strict";
(function () {
  if (!window.PlaySputnikConfig) throw new Error("app-config must load before app-session");

  // ── Config ──────────────────────────────────────────────────────────────────
  const IDLE_TIMEOUT_MS = 3 * 60 * 1000;       // 3 min inactivity → pause session
  const CONTINUITY_GAP_MS = 2 * 60 * 1000;     // 2 min gap on return → continue same session
  const MIN_SESSION_MS = 30 * 1000;             // ignore sessions shorter than 30s (tab flash)

  function createSessionTools({ getState, saveState, onSessionUpdate }) {
    // ── Internal state ───────────────────────────────────────────────────────
    let _sessionStart = null;       // Date when current active session began
    let _activeMs = 0;              // accumulated active milliseconds this session
    let _lastActivity = Date.now(); // last known user interaction timestamp
    let _idleTimer = null;          // setTimeout handle for idle detection
    let _isIdle = false;            // whether the session is currently paused
    let _pausedAt = null;           // when idle/hidden started

    // ── Helpers ─────────────────────────────────────────────────────────────
    function nowMs() { return Date.now(); }

    function flushSession() {
      if (!_sessionStart || _activeMs < MIN_SESSION_MS) {
        _sessionStart = null;
        _activeMs = 0;
        return;
      }
      const session = {
        startedAt: new Date(_sessionStart).toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: _activeMs,
        durationMin: Math.round(_activeMs / 60000),
      };
      const state = getState();
      state.sessionLog = [session, ...(state.sessionLog || [])].slice(0, 100);
      saveState();
      if (onSessionUpdate) onSessionUpdate(session);
      _sessionStart = null;
      _activeMs = 0;
    }

    function pauseSession() {
      if (_isIdle) return;
      _isIdle = true;
      _pausedAt = nowMs();
      if (_sessionStart) {
        _activeMs += _pausedAt - Math.max(_sessionStart, _lastActivity - IDLE_TIMEOUT_MS);
      }
    }

    function resumeSession() {
      const gap = _pausedAt ? nowMs() - _pausedAt : 0;
      _isIdle = false;
      _pausedAt = null;

      if (!_sessionStart) {
        // Brand new session
        _sessionStart = nowMs();
        _activeMs = 0;
      } else if (gap > CONTINUITY_GAP_MS) {
        // Gap too large → flush old session and start fresh (feature 12: continuity threshold)
        flushSession();
        _sessionStart = nowMs();
        _activeMs = 0;
      }
      // gap ≤ CONTINUITY_GAP_MS → continue existing session seamlessly (feature 12)
    }

    function resetIdleTimer() {
      clearTimeout(_idleTimer);
      _lastActivity = nowMs();
      if (_isIdle) resumeSession();
      _idleTimer = setTimeout(() => {
        pauseSession();
      }, IDLE_TIMEOUT_MS);
    }

    // ── Page Visibility API (feature 11 + 12) ───────────────────────────────
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimeout(_idleTimer);
        pauseSession();
      } else {
        resumeSession();
        resetIdleTimer();
      }
    });

    // ── User activity signals (feature 11: idle detection) ──────────────────
    ["mousemove", "keydown", "pointerdown", "scroll", "touchstart"].forEach((evt) => {
      document.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    // ── Session start on first interaction ──────────────────────────────────
    resumeSession();
    resetIdleTimer();

    // ── Flush on page unload ─────────────────────────────────────────────────
    window.addEventListener("pagehide", flushSession);
    window.addEventListener("beforeunload", flushSession);

    // ── Public API ───────────────────────────────────────────────────────────
    function currentSessionMinutes() {
      if (!_sessionStart) return 0;
      const elapsed = _isIdle ? 0 : nowMs() - Math.max(_sessionStart, _lastActivity - IDLE_TIMEOUT_MS);
      return Math.max(0, Math.round((_activeMs + Math.max(0, elapsed)) / 60000));
    }

    function sessionLog() {
      return getState().sessionLog || [];
    }

    function totalPlayMinutes() {
      return sessionLog().reduce((sum, s) => sum + (s.durationMin || 0), 0);
    }

    function sessionSummary() {
      const log = sessionLog();
      const totalMin = totalPlayMinutes();
      const sessionCount = log.length;
      const avgMin = sessionCount ? Math.round(totalMin / sessionCount) : 0;
      return { totalMin, sessionCount, avgMin, currentMin: currentSessionMinutes() };
    }

    return {
      currentSessionMinutes,
      sessionLog,
      totalPlayMinutes,
      sessionSummary,
    };
  }

  window.PlaySputnikSession = { createSessionTools };
})();
