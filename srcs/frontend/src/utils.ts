//--------------------------
// Routing
//--------------------------
export function navigate(path: string, state: any = {}) {
  if (window.location.pathname === path) return;
  window.history.pushState(state, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function enableLeaveWarning(
  message = "Leaving will end the current match."
) {
  const beforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = message;
  };

  const handlePopState = (e: PopStateEvent) => {
    e.stopImmediatePropagation(); // prevent Router's popstate listener from running

    const confirmLeave = confirm(message);
    if (confirmLeave) {
      cleanup();
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      history.pushState({}, "", window.location.pathname);
    }
  };

  window.addEventListener("beforeunload", beforeUnload);
  window.addEventListener("popstate", handlePopState, true);

  const cleanup = () => {
    window.removeEventListener("beforeunload", beforeUnload);
    window.removeEventListener("popstate", handlePopState, true);
  };

  return cleanup;
}

//--------------------------
// UI Helpers
//--------------------------
//showMessage()
