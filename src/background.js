// Minimal service worker — no course/focus/lock logic.
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(["notesByCourse"]);
  if (!data.notesByCourse) {
    await chrome.storage.local.set({ notesByCourse: {} });
  }
});
