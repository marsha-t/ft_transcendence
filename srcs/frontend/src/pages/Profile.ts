import { IComponent } from "../components/IComponent";
import { ProfileInfo } from "./ProfileInfo.js";
import { friendsAndUsers } from "./FriendsAndUsers.js";
import { MatchHistory, HeatMap } from "./matchHistory.js"; 

export class Profile implements IComponent {
  private container!: HTMLElement;
  private profileInfo: ProfileInfo;
  private friendsAndUsers: friendsAndUsers;
  private heatMap: HeatMap;
  private matchHistory: MatchHistory;

  async fetchProfileData(): Promise<void> {
    try {
      await Promise.all([
        this.profileInfo.fetchProfileData(),
        this.matchHistory.fetchData()
      ]);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  }

  constructor() {
    this.profileInfo = new ProfileInfo(() => this.onProfileUpdate());
    this.friendsAndUsers = new friendsAndUsers(() => this.onProfileUpdate());
    this.heatMap = new HeatMap();
    this.matchHistory = new MatchHistory();
  }

  private onProfileUpdate(): void {
    // Refresh components when profile updates.
    // Delay slightly to give backend time to persist avatar change.
    setTimeout(() => {
      this.fetchProfileData();
      this.friendsAndUsers.fetchData();
      this.heatMap.refreshHeatmap();
    }, 100);
  }

  public render(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = `
        flex justify-center bg-color-yellow
        h-full py-[23px]`;

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

    const observer = new MutationObserver(() => {
      if (this.container.parentElement) {
        this.fetchProfileData();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return this.container;
  }
}