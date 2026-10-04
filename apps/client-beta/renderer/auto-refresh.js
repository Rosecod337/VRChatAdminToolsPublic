"use strict";

(function initializeAutoRefresh(root) {
  class AutoRefreshController {
    constructor({ getJob, paused = () => false, changed = () => {}, now = Date.now, setTimer = (callback, delay) => root.setTimeout(callback, delay), clearTimer = id => root.clearTimeout(id) }) {
      Object.assign(this, { getJob, paused, changed, now, setTimer, clearTimer });
      this.timer = null; this.busy = false; this.key = ""; this.dueAt = 0; this.failures = 0; this.lastCheckedAt = null; this.stopped = false;
    }
    wake({ immediate = false } = {}) {
      if (this.timer) this.clearTimer(this.timer); this.timer = null;
      if (this.stopped || this.paused()) return;
      const job = this.getJob();
      if (!job) { this.key = ""; this.changed(this.state()); return; }
      if (job.key !== this.key) { this.key = job.key; this.failures = 0; this.dueAt = this.now() + job.interval; }
      if (immediate) this.dueAt = this.now();
      this.changed(this.state());
      this.timer = this.setTimer(() => { this.timer = null; void this.tick(); }, Math.max(100, this.dueAt - this.now()));
    }
    async tick() {
      if (this.stopped || this.busy || this.paused()) { this.wake(); return; }
      const job = this.getJob(); if (!job) { this.wake(); return; }
      this.busy = true; this.changed(this.state());
      try { await job.run(); this.failures = 0; this.lastCheckedAt = this.now(); }
      catch { this.failures = Math.min(5, this.failures + 1); }
      finally { this.busy = false; this.dueAt = this.now() + Math.min(300000, job.interval * 2 ** this.failures); this.wake(); }
    }
    state() { return { key: this.key, busy: this.busy, failures: this.failures, dueAt: this.dueAt, lastCheckedAt: this.lastCheckedAt }; }
    stop() { this.stopped = true; if (this.timer) this.clearTimer(this.timer); this.timer = null; }
  }
  if (typeof module === "object" && module.exports) module.exports = { AutoRefreshController };
  if (root.document) root.betaAutoRefresh = { AutoRefreshController };
})(typeof window === "object" ? window : globalThis);
