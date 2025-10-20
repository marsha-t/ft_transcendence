import { Router } from './Router.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { TournamentDraftStore } from "./services/tournament/TournamentDraftStore.js";
import { isTournamentFlow } from "./utils.js";

// --- beforeunload: handles both draft + active tournament ---
window.addEventListener("beforeunload", (event) => {
  const isActiveTournament = localStorage.getItem("activeTournament") === "true";
  const inDraftFlow = isTournamentFlow(window.location.pathname) && TournamentDraftStore.players.length > 0;

  if (isActiveTournament) {
    event.preventDefault();
    event.returnValue = "A tournament is currently in progress. Leaving will end it.";
  } else if (inDraftFlow) {
    event.preventDefault();
    event.returnValue = ""; // triggers native browser prompt (no custom text)
  }
});

// --- popstate: handles SPA navigations ---
window.addEventListener("popstate", () => {
  const path = window.location.pathname;
  const isActiveTournament = localStorage.getItem("activeTournament") === "true";
  const hasDraft = TournamentDraftStore.players.length > 0;

  // Case 1: navigating away during setup
  if (!isTournamentFlow(path) && hasDraft) {
    const discard = confirm("You have an unfinished tournament setup. Leave and discard it?");
    if (discard) {
      TournamentDraftStore.clear();
    } else {
      // stay in tournament flow
      history.pushState({}, "", "/tournament/setup");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    return; // stop further checks
  }

  // Case 2: navigating away during an active tournament
  if (isActiveTournament) {
    const leave = confirm("Tournament in progress. Leaving will end it.");
    if (leave) {
      localStorage.removeItem("activeTournament");
      // optionally: apiServices.tournament.updateTournamentStatus(id, "ABORTED")
    } else {
      // cancel navigation
      history.pushState({}, "", window.location.pathname);
    }
  }
});


window.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header-container');
    const contentContainer = document.getElementById('content-container');
    const footerContainer = document.getElementById('footer-container');

    if (!headerContainer || !contentContainer || !footerContainer) {
        console.error('One or more required container elements not found in the DOM.');
        return;
    }

    const headerComponent = new Header();
    headerContainer.appendChild(headerComponent.render());

    const footerComponent = new Footer();
    footerContainer.appendChild(footerComponent.render());

    new Router(contentContainer);
});