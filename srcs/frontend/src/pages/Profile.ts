import { IComponent } from "../components/IComponent";
import { ProfileInfo } from "./ProfileInfo.js";
import { friendsAndUsers } from "./FriendsAndUsers.js";
import { MatchHistory, HeatMap } from "./matchHistory.js"; 


/**
 * Profile Page Component
 * ----------------------
 *
 * The Profile class acts as a container and coordinator for multiple
 * profile-related subcomponents:
 * - ProfileInfo: displays and updates user profile details, profile card (username, avatar, edit profile), profile settings (user credentials, password change, 2FA)
 * - FriendsAndUsers: manages friends list and user interactions (like searching/adding/removing friends)
 * - HeatMap: visualizes user activity (game activity over time) how often user plays games
 * - MatchHistory: shows past matches and results
 *
 * Responsibilities:
 * - Initialize all profile-related components (ProfileInfo, FriendsAndUsers, HeatMap, MatchHistory)
 * - Fetch and refresh profile data across components
 * - Handle profile update events and trigger re-fetching when needed
 * - Define the layout and rendering order of the profile page
 */
export class Profile implements IComponent {
  private container!: HTMLElement;
  private profileInfo: ProfileInfo;
  private friendsAndUsers: friendsAndUsers;
  private heatMap: HeatMap;
  private matchHistory: MatchHistory;
  private _observer?: MutationObserver;

/**
 ** Initialize all profile-related components (ProfileInfo, FriendsAndUsers, HeatMap, MatchHistory) **
    this constructor sets up the Profile page by creating instances of each subcomponent and passing a callback as an argument to handle profile updates.
    e.g., when the user updates their profile info, the onProfileUpdate method will be called to refresh data across components.
 */
  constructor() {
    this.profileInfo = new ProfileInfo(() => this.onProfileUpdate());
    this.friendsAndUsers = new friendsAndUsers(() => this.onProfileUpdate());
    this.heatMap = new HeatMap();
    this.matchHistory = new MatchHistory();
  }

  // ** Fetch and refresh profile data across components (fetch all data needed for profile page before rendering) **

  private async fetchProfileData(): Promise<void> {
    await Promise.all([
      this.profileInfo.fetchProfileData(),
      this.friendsAndUsers.fetchData(),
      this.matchHistory.fetchData()
    ]);
  }

  /* ** Handle profile update events and trigger re-fetching when needed **
     refreshes all profile-related components when the profile is updated.
     the delay allows time for backend processes (like avatar changes) to complete before fetching fresh data.
  */
  private onProfileUpdate(): void {
    setTimeout(() => {
      this.fetchProfileData();
      // this.friendsAndUsers.fetchData();
      this.heatMap.refreshHeatmap();
    }, 100);
  }

  // ** Define the layout and rendering order of the profile page **
  public render(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = `flex justify-center bg-color-yellow h-full py-[23px]`;

    this.fetchProfileData();
        
    const subContainer = document.createElement('div');
    subContainer.className = `
      grid gap-4 grid-cols-1 sm:grid-cols-[1fr_1.3fr]
      grid-rows-[250px_1fr] min-h-0
      rounded-[16px] shadow-lg
      mx-[23px] w-[calc(100%-46px)]
      py-6 px-10`;
    subContainer.style.backgroundColor = 'var(--color-background-primary)';
    subContainer.style.maxHeight = 'calc(100vh - 46px)';
    subContainer.style.overflow = 'hidden';

    // Profile card
    const profileInfo = this.profileInfo.render();
    // Heatmap
    const heatmap = this.heatMap.render();
    // Friends
    const friendsAndUsers = this.friendsAndUsers.render();
    // Match history
    const matchHistory = this.matchHistory.render();

    // Append everything
    subContainer.appendChild(profileInfo);
    subContainer.appendChild(heatmap);
    subContainer.appendChild(friendsAndUsers);
    subContainer.appendChild(matchHistory);
    this.container.appendChild(subContainer);

    // Observe DOM attachment to trigger data refresh once mounted
    this._observer = new MutationObserver(() => {
      if (this.container.parentElement) {
        this.fetchProfileData();
        this._observer?.disconnect();
      }
    });
    this._observer.observe(document.body, { childList: true, subtree: true });

    return this.container;
  }

  // Call cleanup on child components and disconnect observers
  public cleanup(): void {
    try {
      try { this.profileInfo?.cleanup?.(); } catch (e) { console.warn('Error cleaning ProfileInfo', e); }
      try { this.friendsAndUsers?.cleanup?.(); } catch (e) { console.warn('Error cleaning FriendsAndUsers', e); }
      try { this.heatMap?.cleanup?.(); } catch (e) { console.warn('Error cleaning HeatMap', e); }
      // HeatMap may not implement cleanup; call if present
      try { (this.heatMap as any)?.cleanup?.(); } catch (e) { console.warn('Error cleaning HeatMap', e); }
    } catch (err) {
      console.warn('Error during Profile cleanup:', err);
    }

    try {
      this._observer?.disconnect();
    } catch (err) {
      console.warn('Error disconnecting Profile observer:', err);
    }

    this.container = null as any;
  }
}