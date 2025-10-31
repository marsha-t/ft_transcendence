//--------------------------
// Routing
//--------------------------
export function navigate(path: string, state: any = {}) {
  if (window.location.pathname === path) return;
  
  const event = new PopStateEvent("popstate");
  (event as any).isSynthetic = true;
  
  window.history.pushState(state, "", path);
  window.dispatchEvent(event);
}

export function enableLeaveWarning(
  message = "Leaving will end the current match.",
  onConfirmLeave?: () => Promise<void> | void 
) {
  let isHandling = false;

  // When user refreshes or closes tab
  const beforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = message;
  };

  // When user navigates within SPA
  const handlePopState = async (e: PopStateEvent) => {

    // Ignore synthetic navigation
    if ((e as any).isSynthetic) return ;
    
    // Avoid double prompts
    if (isHandling) return ;
    isHandling = true;

    const confirmLeave = confirm(message);
    if (confirmLeave) {
      try {
        if (onConfirmLeave) await onConfirmLeave();
      } catch (err) {
        console.log("Error during onConfirmLeave: ", err);
      }
      cleanup();
      window.dispatchEvent(new PopStateEvent("popstate")); // re-trigger Router's popstate listener to navigate normally
    } else {
      history.pushState({}, "", window.location.pathname);
    }
    isHandling = false;
  };

  window.addEventListener("beforeunload", beforeUnload);
  window.addEventListener("popstate", handlePopState, true); // capture phase = true

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
