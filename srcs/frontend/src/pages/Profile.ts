import { IComponent } from "../components/IComponent";
import { ProfileServices } from '../services/profile/ProfileServices.js';
import { ProfileData, FriendsData, AvatarUploadResponse, AvatarDeleteResponse, UserSearchResult, FriendRequest, MatchHistory,  ApiResponse, } from '../services/profile/types';

// ***************************************
/*
  - profile
    - profile card
      - settings
    - friends
      - friends
      - requests
      - add friend
        - search
    - stats - dashboard
    - match history
  */
// ***************************************
export class Profile implements IComponent {
  private isFriendsActive: boolean = true;
  private username: string = "";
  private email: string = "";
  private avatar: string = "";
  private friendsListData: { avatarURL: string; name: string; online: boolean }[] = [];
  private requestsListData: FriendRequest[] = [];
  private matchHistoryData: MatchHistory[] = [];
  private popupAvatarEl: HTMLElement | null = null;
  private profileService: ProfileServices;
  private heatmapContainer: HTMLElement | null = null;
  private messageContainer!: HTMLDivElement;
  private container!: HTMLElement;
  



  constructor() {
      this.profileService = new ProfileServices();
  }

  // Return a full avatar URL with a cache-busting timestamp to avoid stale images
  private getAvatarUrl(path?: string): string {
    if (!path) return "";
    const backendUrl = "http://localhost:5001";
    // if path already looks like a full URL, use it
    const full = path.startsWith("http://") || path.startsWith("https://");
    const base = full ? path : `${backendUrl}${path}`;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}t=${Date.now()}`;
  }

  public render():  HTMLElement {
    this.container = document.createElement('div');
        this.container.className = `
        flex justify-center bg-color-yellow
        h-full py-[23px]`;

        
  // styles are handled inline using Tailwind classes in this file
  // (do not load external Profile.css as per project convention)
  this.fetchProfileData();
        
    const subContainer = document.createElement('div');
    subContainer.className = `
      grid gap-4 grid-cols-1 sm:grid-cols-[1fr_1.3fr]
      grid-rows-[250px_1fr] min-h-0
      bg-background rounded-[16px] shadow-lg
      mx-[23px] w-[calc(100%-46px)]
      py-6 px-10`;
    // Constrain height so the bottom row can take the remaining space (1fr) and not overflow
    subContainer.style.maxHeight = 'calc(100vh - 46px)';
    subContainer.style.overflow = 'hidden';

    // Profile card
    // ***************************************
    //renderProfileCard()
    
  const profileInfo = document.createElement("div");
  // add `profile-card` so loading state toggles (.profile-card is queried elsewhere)
  profileInfo.className = `profile-card rounded-2xl bg-[#21447E] opacity-100 text-color_white
    p-4 relative flex flex-col items-center`;

    const logoutBtn = document.createElement("div");
    logoutBtn.textContent = "logout";
    logoutBtn.className = `
           absolute top-2 left-2
        w-[105px] h-[32px]
        rounded-[7px]
        px-[10px] py-[6px] font-pixel
        text-color_white
        border border-[1px] border-border-green
        inline-flex justify-center items-center
        no-underline cursor-pointer
        transition-colors duration-200 ease-in-out
        hover:bg-color-green
        hover:text-color_white
        `;
  
    // logoutBtn.addEventListener("click", );
    const editProfileBtn = document.createElement("div");
    editProfileBtn.textContent = "edit";
    editProfileBtn.className = `
           absolute top-2 right-2
        w-[105px] h-[32px]
        rounded-[7px]
        px-[10px] py-[6px] font-pixel
        text-color_white
        border border-[1px] border-border-green
        inline-flex justify-center items-center
        no-underline cursor-pointer
        transition-colors duration-200 ease-in-out
        hover:bg-color-green
        hover:text-color_white
        `;
  
    editProfileBtn.addEventListener("click", () => this.openSettingsPopup());
    profileInfo.style.position = "relative";
    const avatar = document.createElement("div");
    // add `profile-avatar` so updateProfileUI() can find and update it
    avatar.className = `profile-avatar w-[132px] h-[132px]
        rounded-full border-[9.95px] border-white
        bg-background-yellow
        mt-6`;
    // set an initial rendering; updateProfileUI will overwrite after fetch
    if (this.avatar) {
      avatar.style.backgroundImage = `url(${this.getAvatarUrl(this.avatar)})`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.textContent = "";
    } else {
      avatar.style.backgroundImage = "";
      avatar.textContent = (this.username ? this.username.charAt(0).toUpperCase() : "");
    }

    const name = document.createElement("h2");
    name.className = `profile-name text-[18px] leading-[22px] tracking-[-0.01em]
      font-pixel font-[400]
      text-color_white
      w-[125px] h-[22px]
      flex justify-center items-center
      rounded-md mt-3`;
    name.textContent = this.username  || "username";

    // const status = document.createElement("p");
    // // status.className = "profile-status online";
    // status.innerHTML = "Online"; // Using innerHTML for the dot

    profileInfo.appendChild(editProfileBtn);
    profileInfo.appendChild(logoutBtn);
    profileInfo.appendChild(avatar);
    profileInfo.appendChild(name);
    // profileInfo.appendChild(status);

// ----------------------------------------------------------------------------------------------
// heatmap
 //renderheatmap()
   const heatmap = document.createElement('div');
   // ensure heatmap doesn't force parent to grow
   heatmap.className = `rounded-2xl bg-[#21447E] opacity-100 p-4 text-white min-h-0 overflow-hidden`;
  // Render last 4 months by default
  void this.createHeatmap(heatmap, 4);

// ----------------------------------------------------------------------------------------------

  // Friends
  // renderFriends()
  // ***************************************
  const friends = document.createElement("div");
  friends.className = `rounded-2xl bg-[#21447E] opacity-100 p-4 text-white min-h-0 overflow-hidden`;

    const friendsHeader = document.createElement("div");
    friendsHeader.className = `
        w-full h-[80px]
        p-2 font-pixel font-[400]
      text-color_white
        flex items-center justify-between
        gap-[58px]
        text-[16px] font-semibold text-white
        my-[10px] border-b border-gray-500`;

 // Friends Title
    const friendsTitle = document.createElement("button");
    friendsTitle.className = `friends-tab
        text-[18px] font-semibold cursor-pointer h-[full]
        hover:text-[--color-button]
    `;
    friendsTitle.textContent = "Friends";

    // Requests Title
    const requestTitle = document.createElement("button");
    requestTitle.textContent = "Request";
    requestTitle.className = `requests-tab
        text-[18px] font-semibold cursor-pointer h-[full]
        hover:text-[--color-button] transition-all duration-200
    `;

      // Highlight active tab
    const setActive = (active: "friends" | "requests") => {
      if (active === "friends") {
        friendsTitle.classList.add("text-[#77AB55]", "font-bold");
        requestTitle.classList.remove("text-[#77AB55]", "font-bold");
      } else {
        requestTitle.classList.add("text-[#77AB55]", "font-bold");
        friendsTitle.classList.remove("text-[#77AB55]", "font-bold");
      }
    };
    // Add click events
    friendsTitle.addEventListener("click", () => {
      this.switchToFriends();
      setActive("friends");
    });
    requestTitle.addEventListener("click", () => {
      this.switchToRequests();
      setActive("requests");
    });
    setActive("friends");
    // Add Friend Button
    const addFriendBtn = document.createElement("button");
    addFriendBtn.className = `
       w-[140px] h-[full] flex justify-center items-center
    text-[16px] font-pixel font-semibold
    border border-[#77AB55] rounded-[7px]
    gap-[6px]
    hover:bg-[#77AB55] hover:text-white
    transition-all duration-200
    `;
    addFriendBtn.addEventListener("click", () => this.openAddFriendPopup());
    addFriendBtn.textContent = "Add Friend";


    friendsHeader.appendChild(friendsTitle);
    friendsHeader.appendChild(requestTitle);
    friendsHeader.appendChild(addFriendBtn);

    // Create the friends/requests container
    const friendsList = document.createElement("div");
    friendsList.className = `friends-list
    flex flex-col gap-3
    w-full
    mt-4
    max-h-[400px]
    px-2
    scrollbar-thin scrollbar-thumb-[#77AB55] scrollbar-track-[#21447E]
  `;
    // ensure internal scrolling without expanding the parent card
    friendsList.style.overflowY = 'auto';
    friendsList.style.maxHeight = 'calc(100% - 80px)';

    // Append to DOM first
    friends.appendChild(friendsHeader);
    friends.appendChild(friendsList);

    // Initialize after elements are in the DOM
    setActive("friends");
    this.isFriendsActive = true;
    
    // Fetch and display data
    this.fetchProfileData().then(() => {
      this.updateFriendsList();
    });


// ----------------------------------------------------------------------------------------------

    // Match history
    // ***************************************
  const matchHistory = document.createElement("div");
  matchHistory.className = `match-history-table rounded-2xl bg-[#21447E] opacity-100 p-4 text-white min-h-0 overflow-hidden`;

    const matchTitle = document.createElement("h3");
    matchTitle.className = " h-[30px] text-[24px] font-pixel font-[400] text-color_white mb-[10px]";
    matchTitle.textContent = "Match History";
    matchHistory.appendChild(matchTitle);

    const table = document.createElement("table");
    table.className = "w-full border-collapse rounded-[20px] overflow-hidden font-pixel";
    table.style.borderSpacing = "0"; // remove gaps for border-collapse
    const thead = document.createElement("thead");
    thead.className = "w-[1014px] h-[47px] font-pixel font-[400] text-color_white";
    const headerRow = document.createElement("tr");
    headerRow.className = ` w-full
        p-2 font-pixel font-[400]
        text-color_white
        gap-[50px] 
        text-[16px] font-semibold text-color_white bg-none
        mb-[10px] border-b border-gray-500 rounded-l-lg`;
        // headerRow.style.borderBottomLeftRadius = "20px";
        // headerRow.style.borderBottomRightRadius = "20px";

    const columns = ["Opponent", "Result", "Score", "Date"];
    columns.forEach((col) => {
      const th = document.createElement("th");
      th.className = "text-center text-[16px] leading-[18px] uppercase text-left px-4 py-3 font-pixel font-[400] text-color_white";
      th.textContent = col;
      headerRow.appendChild(th);
    });
  
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    tbody.id = "match-history-body"
    
    table.appendChild(tbody);
    matchHistory.appendChild(table);
    
    this.fetchProfileData().then(() => {
      this.updateMatchHistory();
    });
    // Append everything
    subContainer.appendChild(profileInfo);
    subContainer.appendChild(heatmap);
    subContainer.appendChild(friends);
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


  // ----------------------------------------------------------------------------------------------


  private createStat(value: string, label: string, extraClass: string): HTMLElement {
    const box = document.createElement("div");
    box.className = "stat-box";

    const number = document.createElement("p");
    number.className = `stat-number ${extraClass}`;
    number.textContent = value;

    const text = document.createElement("p");
    text.textContent = label;

    box.appendChild(number);
    box.appendChild(text);
    return box;
  }

  // ----------------------------------------------------------------------------------------------

  // ***************************************
  // friends
private createFriend(avatarURL: string, name: string, online: boolean): HTMLElement {
  const item = document.createElement("div");
   item.className = `
    w-full h-[65px]
    flex items-center justify-between
    rounded-[10px] px-4 py-3
    ${online ? "bg-[#C7D6F0]" : "bg-[#EBF1FA]"}

    text-[#183B76] font-pixel
    hover:opacity-90 transition
  `;

  const inner = document.createElement("div");
  // layout: left = avatar+name, middle = status, right = remove button
  inner.className = "friend-item-inner w-full flex items-center justify-between";

  // Frame for avatar + name
  const profileText = document.createElement("div");
  profileText.className = `
    flex items-center gap-3
  `;

  const avatar = document.createElement("div");
  avatar.className = `
    w-[45px] h-[45px]
    rounded-full border-2 border-white shadow-md
  `;

  // Use background-image for the avatar
  const backendUrl = "http://localhost:5001"; // same as how the profile picture is being shown
  avatar.style.backgroundImage = `url(${this.getAvatarUrl(avatarURL)})`;
  avatar.style.backgroundSize = "cover";
  avatar.style.backgroundPosition = "center";
  avatar.textContent = ""; // clear any fallback text

  const friendName = document.createElement("span");
  friendName.className = `
    text-[16px] font-semibold text-[#183B76]
  `;
  friendName.textContent = name;

  profileText.appendChild(avatar);
  profileText.appendChild(friendName);

  // Status circle
  const status = document.createElement("span");
  status.className = `
    w-[14px] h-[14px]
    rounded-full
    ${online ? "bg-[#77AB55]" : "bg-gray-400"}
  `;

  
  const removeBtn = document.createElement("button");
  removeBtn.className = `
    w-[28px] h-[28px]
    flex items-center justify-center
    rounded-full border border-[#77AB55]
    text-[#77AB55] text-[18px] font-bold
    hover:bg-[#77AB55] hover:text-white
    transition-all duration-200
    cursor-pointer
  `;
  removeBtn.innerHTML = "&times;";
 
  const profileServices = this.profileService;

  removeBtn.addEventListener("click", async () => {
    const response = await profileServices.removeFriend(name);
    console.log("API response:", response);
    if (response.success) {
      item.remove(); // Remove from UI
      console.log(`${name} removed successfully`);
      this.fetchProfileData();
      this.switchToFriends(); // ✅ use captured instance
    } else {
      console.error("Failed to remove friend:", response.message);
    }
  });

  // place status near the name and keep remove button at the far right
  const leftGroup = document.createElement('div');
  leftGroup.className = 'flex items-center gap-3';
  leftGroup.appendChild(profileText);
  leftGroup.appendChild(status);

  inner.appendChild(leftGroup);
  inner.appendChild(removeBtn);
  item.appendChild(inner);

  return item;
}

  // ----------------------------------------------------------------------------------------------

// ***************************************
// match history
  private createMatch(opponent: string, opponentAvatar: string, result: "WIN" | "LOSS", score: string, date: string, index: number): HTMLElement {
    const row = document.createElement("tr");
    row.className = `w-[full] h-[65px] justify-between  text-center px-4 py-3 m-3
    ${index % 2 === 0 ? "bg-[#7EA2DD]" : "bg-[none]"} `;
    row.style.overflow = "hidden";  

    const opponentCell = document.createElement("td");
    opponentCell.style.borderTopLeftRadius = "20px";
    opponentCell.style.borderBottomLeftRadius = "20px";
    opponentCell.innerHTML = `
      <div class="flex items-center justify-center gap-3">
        <img src="${this.getAvatarUrl(opponentAvatar)}" 
            alt="${opponent}'s avatar" 
            class="w-8 h-8 rounded-full object-cover border border-gray-600" />
        <span>${opponent}</span>
      </div>
    `;

    const resultCell = document.createElement("td");
    resultCell.textContent = result;
    const scoreCell = document.createElement("td");
    scoreCell.textContent = score;

    const dateCell = document.createElement("td");
    dateCell.textContent = date;
    dateCell.style.borderTopRightRadius = "20px";
    dateCell.style.borderBottomRightRadius = "20px";

    [opponentCell, resultCell, scoreCell, dateCell].forEach(cell => {
      cell.classList.add("font-pixel"); 
      cell.classList.add("px-4", "py-2");
    });
    row.appendChild(opponentCell);
    row.appendChild(resultCell);
    row.appendChild(scoreCell);
    row.appendChild(dateCell);

    return row;
  }



// --------------------------------------------------------------------------

// ***************************************
// requests
  private createRequest(avatarURL: string, name: string, reqId: number): HTMLElement {
    const item = document.createElement("div");
    item.className = `
    w-full h-[65px]
    flex items-center justify-between
    rounded-[10px] px-4 py-3 mb-3
    ${reqId % 2 === 0 ? "bg-[#7EA2DD]" : "bg-[none]"} text-[color_white] font-pixel
    hover:opacity-90 transition
  `;

  const inner = document.createElement("div");
  // make the inner container stretch full width and arrange left/right
  inner.className = "request-item-inner w-full flex items-center justify-between";

    // Avatar + Username
    const profileText = document.createElement("div");
    profileText.className = `flex items-center gap-3`;

    const avatar = document.createElement("div");
    avatar.className = `
    w-[45px] h-[45px]
    rounded-full border-2 border-white shadow-md
  `;
  avatar.style.backgroundImage = `url(${this.getAvatarUrl(avatarURL)})`;
    avatar.style.backgroundSize = "cover";
    avatar.style.backgroundPosition = "center";
    avatar.textContent = ""

    const userName = document.createElement("span");
    userName.className = `text-[16px] font-semibold text-[#183B76]`
    userName.textContent = name;

    profileText.appendChild(avatar);
    profileText.appendChild(userName);

    // Buttons
  const buttons = document.createElement("div");
  // compact buttons aligned to the right
  buttons.className = `flex items-center gap-2`;
    const profileServices = this.profileService;
    const acceptBtn = document.createElement("button");
    acceptBtn.className = `
    px-3 py-1 rounded-[6px]
    border border-[#77AB55]
    text-[#77AB55] font-semibold text-[12px]
    hover:bg-[#77AB55] hover:text-white
    transition-all duration-200
  `;
    acceptBtn.textContent = "Accept";
    acceptBtn.addEventListener("click", async () => {
      // console.log(`Accepted friend request from ${name}`);
      // handle accept logic !!!
      const res = await profileServices.respondToRequest(name, "accept");
      if (res.success) {
        console.log(`✅ Accepted friend request from ${name}`);
        item.remove(); // Remove from UI
        const friendsResponse: ApiResponse<FriendsData> = await this.profileService.getFriends();
        if (friendsResponse.success) {
            this.friendsListData = friendsResponse.data?.friends || [];
            this.fetchProfileData();
            this.switchToRequests();
          }
      } else {
        alert(res.message);
      }
    });

    const declineBtn = document.createElement("button");
    declineBtn.className = `
    px-3 py-1 rounded-[6px]
    border border-[#C44C4C]
    text-[#C44C4C] font-semibold text-[12px]
    hover:bg-[#C44C4C] hover:text-white
    transition-all duration-200
  `;
    declineBtn.textContent = "Decline";
    declineBtn.addEventListener("click", async () => {
    const res = await profileServices.respondToRequest(name, "reject");
    if (res.success) {
        console.log(`❌ Declined friend request from ${name}`);
        item.remove(); // Remove from UI
        this.fetchProfileData();
        this.switchToRequests();
      } else {
        alert(res.message);
      }
    });

    buttons.appendChild(acceptBtn);
    buttons.appendChild(declineBtn);

    inner.appendChild(profileText);
    inner.appendChild(buttons);
    item.appendChild(inner);

    return item;
  }

// ***************************************
// friends
  private switchToFriends(): void {
    this.isFriendsActive = true;
    this.updateFriendsList();
  }

  private switchToRequests(): void {
      this.isFriendsActive = false;
      this.updateFriendsList();
  }

private updateFriendsList(): void {
    // Check if container exists first
    if (!this.container) {
        console.log('Container not found');
        return;
    }

    const friendsList = this.container.querySelector(".friends-list");
    if (!friendsList) {
        console.log('Friends list not found');
        return;
    }

    // Clear current items
    friendsList.innerHTML = "";

    console.log('Updating friends list. Active:', this.isFriendsActive);
    console.log('Friends data:', this.friendsListData);
    console.log('Requests data:', this.requestsListData);

    // Add new items
    if (this.isFriendsActive) {
        if (this.friendsListData.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.textContent = "No friends yet";
            emptyState.className = "text-center text-gray-400 mt-4";
            friendsList.appendChild(emptyState);
        } else {
            this.friendsListData.forEach(f =>
                friendsList.appendChild(this.createFriend(f.avatarURL, f.name, f.online))
            );
        }
    } else {
        if (this.requestsListData.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.textContent = "No pending requests";
            emptyState.className = "text-center text-gray-400 mt-4";
            friendsList.appendChild(emptyState);
        } else {
            this.requestsListData.forEach(r => {
                if (!r.from) return; // safety check
                friendsList.appendChild(
                    this.createRequest(r.from.avatar, r.from.username, r.id)
                );
            });
        }
    }

    // Try to update tab classes only if the elements exist
    const friendsTitle = this.container.querySelector(".friends-tab");
    const requestTitle = this.container.querySelector(".requests-tab");
    
    if (friendsTitle && requestTitle) {
        friendsTitle.className = this.isFriendsActive ? "friends-tab active" : "friends-tab";
        requestTitle.className = this.isFriendsActive ? "requests-tab" : "requests-tab active";
    }
}

private updateMatchHistory(): void {
  
  const tableBody = this.container?.querySelector<HTMLTableSectionElement>("#match-history-body");
  if (!tableBody) {
      console.warn("updateMatchHistory: tbody not found (#match-history-body)");
      return;
    }
  tableBody.innerHTML = ""; //clear old matches first
  if (!this.matchHistoryData || this.matchHistoryData.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 4;
    emptyCell.textContent = "No matches played yet.";
    emptyCell.className = "text-gray-400 text-center py-3";
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
    return;
  }
  console.log("Match history data:", this.matchHistoryData);

  this.matchHistoryData.forEach((match, index) => { 
    const formattedDate = new Date(match.date).toLocaleDateString();
    const score = `${match.userScore} - ${match.opponentScore}`;
    const row = this.createMatch(match.opponent, match.opponentAvatar, match.result, score, formattedDate, index);
    tableBody.appendChild(row);
  });
}

//-----------------------
 // ***************************************
 // profile
private async fetchProfileData(): Promise<void> {
  this.setLoadingState(true);
  try {
      const profileResponse: ApiResponse<ProfileData> = await this.profileService.getProfile();
      if (profileResponse.success && profileResponse.data) {
          this.username = profileResponse.data.username;
          this.email = profileResponse.data.email;
          this.avatar = profileResponse.data.avatar || "";
          this.updateProfileUI();
      } else {
          console.error('Failed to fetch profile data:', profileResponse.message);
      }
      const friendsResponse: ApiResponse<FriendsData> = await this.profileService.getFriends();
      if (friendsResponse.success) {
          this.friendsListData = friendsResponse.data?.friends || [];
          if (this.isFriendsActive) this.updateFriendsList();
          this.updateProfileUI();
      }
      const requestsResponse: ApiResponse<FriendRequest[]> = await this.profileService.getIncomingRequests();
        if (requestsResponse.success && requestsResponse.data) {
            this.requestsListData = requestsResponse.data;
            this.updateFriendsList(); // update UI for requests
        }
        const matchHistoryResponse: ApiResponse<MatchHistory[]> =
        await this.profileService.getMatchHistory(1); // or this.currentUserId if dynamic
  
      if (matchHistoryResponse.success && matchHistoryResponse.data) {
        this.matchHistoryData = matchHistoryResponse.data;
        this.updateMatchHistory();

      } else {
        console.warn("No match history found or failed to fetch:", matchHistoryResponse.message);
      }
  } catch (error: any) {
      console.error('Error fetching profile data:', error);
      this.updateProfileUI();
  } finally {
      this.setLoadingState(false);
  }
}

  private setLoadingState(loading: boolean): void {
    const card = this.container.querySelector('.profile-card');
    if (card) card.classList.toggle('loading', loading);
    console.log(`Loading state: ${loading}`);
  }

  private updateProfileUI(): void {
    const nameEl = this.container.querySelector(".profile-name") as HTMLElement;
    const avatarEl = this.container.querySelector(".profile-avatar") as HTMLElement;
  
    if (!nameEl || !avatarEl) return;
  
    // Update name
    nameEl.textContent = this.username || "";
  
    // Update avatar
    if (this.avatar) {
      avatarEl.style.backgroundImage = `url(${this.getAvatarUrl(this.avatar)})`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
      avatarEl.textContent = "";
    }
    else {
      avatarEl.style.backgroundImage = "";
      // Only show first letter if we have a username
      avatarEl.textContent = this.username ? this.username.charAt(0).toUpperCase() : "";
      avatarEl.textContent = this.username.charAt(0).toUpperCase() || "";
    }
  }
  
  // Method to update the avatar in the settings's page once it gets changed
  private updatePopupAvatar(): void {
    if (!this.popupAvatarEl) return;
  
    if (this.avatar) {
      this.popupAvatarEl.style.backgroundImage = `url(${this.getAvatarUrl(this.avatar)})`;
      this.popupAvatarEl.style.backgroundSize = "cover";
      this.popupAvatarEl.style.backgroundPosition = "center";
      this.popupAvatarEl.textContent = "";
    } else {
      this.popupAvatarEl.style.backgroundImage = "";
      this.popupAvatarEl.textContent = this.username.charAt(0).toUpperCase() || "";
    }
  }
//-------------------------

private openAddFriendPopup(): void {
  const overlay = document.createElement("div");
  overlay.className = `modal-overlay
    fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50
  `;
  
  // Modal popup
  const modal = document.createElement("div");
  modal.className = `modal
    w-[570px] h-[740px] rounded-[16px] bg-[#183B76]
    flex flex-col p-4 relative
    opacity-100
  `;
  //#7EA2DD
  
  const header = document.createElement("div");
  header.className = `modal-header w-full h-[30px] m-[10px]`;

  const title = document.createElement("h2");
  title.className = `
  font-pixel font-bold text-[16px] w-full h-[18px]
  text-white
  `;
  title.textContent = "Search for Users";

  const closeBtn = document.createElement("button");
  closeBtn.className = `absolute top-2 right-2
        w-[16px] h-[16px]
        px-[10px] py-[6px] font-pixel 
        font-bold
        m-[10px]
        mr-[20px]
        text-color_white
        cursor-pointer`;
  closeBtn.innerHTML = "X";
  closeBtn.addEventListener("click", () => overlay.remove());

  header.appendChild(title);
  header.appendChild(closeBtn);

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search username...";
  searchInput.className = `
     w-[calc(100%-30px)] h-[50px] rounded-[10px] px-3
     bg-[#7EA2DD] text-white border border-gray-500
    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500
  `;

  const resultsContainer = document.createElement("div");
  resultsContainer.className = `flex flex-col gap-3
          w-[calc(100%-50px)] ml-[10px]
          mt-4 pb-2
          max-h-[550px] overflow-y-auto
          scrollbar-thin scrollbar-thumb-[#183B76] scrollbar-track-[#7EA2DD]
        `;

  modal.appendChild(header);
  modal.appendChild(searchInput);
  modal.appendChild(resultsContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const service = new ProfileServices();
  const backendUrl = "http://localhost:5001";
  const debounceDelay = 400;
  let typingTimer: any;
  // Track requests sent during this modal session
  const localPending = new Set<string>();

  // 🧩 Reusable render function
  const renderResults = (data: UserSearchResult[]) => {
    resultsContainer.innerHTML = ""; // Clear old results

    if (!data || data.length === 0) {
      resultsContainer.innerHTML = "<p class='no-results'>No users found</p>";
      return;
    }

    data.forEach((user, index) => {
      console.log(`${user.username}: ${user.friendStatus}`);
      const userDiv = document.createElement("div");
      userDiv.className = `
        flex items-center justify-between  h-[55px]
        rounded-[10px] px-4 py-3
        ${index % 2 === 0 ? "bg-[#C7D6F0]" : "bg-[#EBF1FA]"}
        text-[#183B76] font-pixel
        transition hover:opacity-90
      `;

      const avatarNameContainer = document.createElement("div");
      avatarNameContainer.className = "flex items-center";

      const avatar = document.createElement("div");
      avatar.style.backgroundImage = `url(${this.getAvatarUrl(user.avatar)})`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.className = `
          w-[45px] h-[45px]
          rounded-full border-2 border-white
          shadow-md flex-shrink-0
        `;

      const name = document.createElement("span");
      name.className = "ml-2 text-[16px] font-semibold text-[#183B76] text-left ";
      name.textContent = user.username;

      const action = document.createElement("div");
      action.className = "flex items-center";

      const isPending =
        user.friendStatus === "pending_sent" || localPending.has(user.username);

      if (isPending) {
        const pendingLabel = document.createElement("span");
        pendingLabel.textContent = "Pending";
        pendingLabel.className = `
          px-4 py-1 rounded-[7px]
          border border-[#77AB55] text-[#77AB55]
          text-[14px] font-semibold
          cursor-default select-none
        `;
        action.appendChild(pendingLabel);
      } else {
        const addBtn = document.createElement("button");
        addBtn.textContent = "Add Friend";
        addBtn.className = `
            px-4 py-1 rounded-[7px]
            border border-[#77AB55]
            text-[#77AB55] font-semibold text-[14px]
            hover:bg-[#77AB55] hover:text-white
            transition-all duration-200
          `;

        addBtn.addEventListener("click", async () => {
          const res = await service.sendFriendRequest(user.username);
          if (res.success) {
            localPending.add(user.username);
            // Swap the button for a non-interactive Pending label immediately
            const pendingLabel = document.createElement("span");
            pendingLabel.textContent = "Pending";
            pendingLabel.className = `
                px-4 py-1 rounded-[7px]
                border border-[#77AB55] text-[#77AB55]
                text-[14px] font-semibold
                cursor-default select-none
              `;
            action.innerHTML = "";
            action.appendChild(pendingLabel);
          } else {
            this.showMessage((res.message || "Failed to send friend request"), 'error');
          }
        });

        action.appendChild(addBtn);
      }

      avatarNameContainer.appendChild(avatar);
      avatarNameContainer.appendChild(name);
      userDiv.appendChild(avatarNameContainer);
      userDiv.appendChild(action);
      resultsContainer.appendChild(userDiv);
    });
  };

  // 🕐 Debounced search input
  searchInput.addEventListener("input", () => {
    clearTimeout(typingTimer);
    const query = searchInput.value.trim();

    if (query.length === 0) {
      resultsContainer.innerHTML = "";
      return;
    }

    resultsContainer.innerHTML = "<p class='loading-text'>Searching...</p>";

    typingTimer = setTimeout(async () => {
      const response = await service.searchUsers(query);
      if (response.success && response.data) renderResults(response.data);
      else resultsContainer.innerHTML = "<p class='no-results'>No users found</p>";
    }, debounceDelay);
  });
}


  private openSettingsPopup(): void {
  const overlay = document.createElement("div");
  // Use Tailwind-style classes so this works without external CSS
  overlay.className = `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`;
    //Create message container for success/error messages
  const modal = document.createElement("div");
  // match styling approach used in add-friend popup (Tailwind-like)
  modal.className = `w-[520px] max-w-[95%] rounded-[16px] bg-[#21447E] text-white p-6 relative opacity-100`;
    
  const header = document.createElement("div");
  header.className = `flex items-start justify-between w-full mb-4`;
    
  const closeBtn = document.createElement("button");
  closeBtn.className = `absolute top-3 right-3 w-[48px] h-[48px] flex items-center justify-center text-white bg-transparent hover:brightness-90 font-pixel text-[36px]`;
  closeBtn.innerHTML = "&times;"; // HTML  '×'
  closeBtn.addEventListener("click", () => overlay.remove());
    
  this.messageContainer = document.createElement('div');
  // Tailwind-friendly message container
  this.messageContainer.className = 'message_container w-full p-3 rounded-md mb-3 text-sm';
  this.messageContainer.style.display = 'none';
  modal.appendChild(this.messageContainer);
  
    // Avatar section
  const avatarSection = document.createElement("div");
  avatarSection.className = `flex items-center gap-4 mb-4`;
  const avatarPlaceholder = document.createElement("div");
  avatarPlaceholder.className = `avatar-placeholder w-[132px] h-[132px] rounded-full border-[9.95px] border-white bg-background-yellow flex items-center justify-center text-3xl font-pixel`;
    if (this.avatar) {
      avatarPlaceholder.style.backgroundImage = `url(${this.getAvatarUrl(this.avatar)})`;
      avatarPlaceholder.style.backgroundSize = "cover";
      avatarPlaceholder.style.backgroundPosition = "center";
    } else {
        avatarPlaceholder.textContent = this.username.charAt(0).toUpperCase() || "";
    }

    this.popupAvatarEl = avatarPlaceholder;

   // Action area: show a row of 4 small avatar circles (placeholders for quick picks)
    const avatarActions = document.createElement('div');
    avatarActions.className = 'flex flex-col gap-2 ml-4';

    // Row of 4 small avatar images
    const smallRow = document.createElement('div');
    smallRow.className = 'flex items-center gap-2';
    const avatarPaths = [
  'http://localhost:5001/uploads/avatars/user_avatar-1.jpg',
  'http://localhost:5001/uploads/avatars/user_avatar-2.jpg',
  'http://localhost:5001/uploads/avatars/user_avatar-3.png',
  'http://localhost:5001/uploads/avatars/user_avatar-4.jpg'
    ];
    for (let i = 0; i < 4; i++) {
      const small = document.createElement('button');
      small.type = 'button';
      small.className = `w-[40px] h-[40px] rounded-full border-2 border-white bg-background-yellow flex items-center justify-center text-sm font-pixel text-color_white focus:outline-none focus:ring-2 focus:ring-[#297138]`;
      small.style.backgroundImage = `url('${avatarPaths[i]}')`;
      small.style.backgroundSize = 'cover';
      small.style.backgroundPosition = 'center';
      small.title = `Select avatar ${i+1}`;
      small.addEventListener('click', async () => {
  // Call backend to set avatar to this preset
  // Send only the filename, backend will copy it from uploads/avatars
        const presetFilename = avatarPaths[i].split('/').pop() || '';
        if (presetFilename) {
          const response = await this.profileService.uploadAvatarFromPreset(presetFilename);
          if (response.success && response.data) {
            this.avatar = response.data.avatar;
            this.updatePopupAvatar();
            this.updateProfileUI();
          } else {
            alert(response.message || 'Failed to set avatar');
          }
        } else {
          alert('Invalid preset avatar filename');
        }
      });
      smallRow.appendChild(small);
    }

    // Buttons under the small avatars
    const btnRow = document.createElement('div');
    btnRow.className = 'flex gap-2 mt-2';

    const changeBtn = document.createElement('button');
    changeBtn.type = 'button';
  changeBtn.textContent = 'Change';
    changeBtn.className = `px-3 py-1 rounded-[8px] bg-[#297138] text-white font-pixel text-[13px] hover:brightness-95 transition`;
    changeBtn.addEventListener('click', () => this.handleAvatarEdit());

    const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'Remove';
  removeBtn.className = `px-3 py-1 rounded-[8px] bg-[#2b3b59] text-white font-pixel text-[13px] hover:brightness-95 transition`;
    removeBtn.addEventListener('click', () => this.handleAvatarDelete());

    btnRow.appendChild(changeBtn);
    btnRow.appendChild(removeBtn);

    avatarActions.appendChild(smallRow);
    avatarActions.appendChild(btnRow);

    avatarSection.appendChild(avatarPlaceholder);
    avatarSection.appendChild(avatarActions);

    header.appendChild(closeBtn);
    header.appendChild(avatarSection);

    modal.appendChild(header);

    // Form fields
    const form = document.createElement("div");
  form.className = `flex flex-col gap-3`;

  // === Username ===
  const usernameGroup = document.createElement("div");
  usernameGroup.className = `flex flex-col gap-1`;

  const usernameLabel = document.createElement("label");
  usernameLabel.className = `text-sm font-semibold`;
  usernameLabel.textContent = "Username";

  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.className = `w-full rounded-[8px] px-3 py-2 bg-[#183B76] border border-gray-500 text-white placeholder-gray-400 focus:outline-none`;
  usernameInput.placeholder = this.username || "";

  usernameGroup.appendChild(usernameLabel);
  usernameGroup.appendChild(usernameInput);

  // === Email ===
  const emailGroup = document.createElement("div");
  emailGroup.className = `flex flex-col gap-1`;

  const emailLabel = document.createElement("label");
  emailLabel.className = `text-sm font-semibold`;
  emailLabel.textContent = "Email";

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.className = `w-full rounded-[8px] px-3 py-2 bg-[#183B76] border border-gray-500 text-white placeholder-gray-400 focus:outline-none`;
  emailInput.placeholder = this.email || "";

  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);

  // === Password ===
  const passwordGroup = document.createElement("div");
  passwordGroup.className = `flex flex-col gap-1`;

  const passwordLabel = document.createElement("label");
  passwordLabel.className = `text-sm font-semibold`;
  passwordLabel.textContent = "Password";

  const oldPasswordInput = document.createElement("input");
  oldPasswordInput.type = "password";
  oldPasswordInput.placeholder = "Old Password";
  oldPasswordInput.className = `w-full rounded-[8px] px-3 py-2 bg-[#183B76] border border-gray-500 text-white placeholder-gray-400 focus:outline-none`;

  const newPasswordInput = document.createElement("input");
  newPasswordInput.type = "password";
  newPasswordInput.placeholder = "New Password";
  newPasswordInput.className = `w-full rounded-[8px] px-3 py-2 bg-[#183B76] border border-gray-500 text-white placeholder-gray-400 focus:outline-none`;

  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(oldPasswordInput);
  passwordGroup.appendChild(newPasswordInput);

  // === Append groups ===
  form.appendChild(usernameGroup);
  form.appendChild(emailGroup);
  form.appendChild(passwordGroup);

  modal.appendChild(form);

  // === 2FA Toggle ===
  const twoFactorGroup = document.createElement("div");
  twoFactorGroup.className = `mt-6 flex items-center justify-between p-4 rounded-[8px] bg-[#183B76]`;

  const twoFactorLabel = document.createElement("div");
  twoFactorLabel.className = "flex flex-col";

  const twoFactorTitle = document.createElement("span");
  twoFactorTitle.className = "text-sm font-semibold";
  twoFactorTitle.textContent = "Two-Factor Authentication";

  const twoFactorDesc = document.createElement("span");
  twoFactorDesc.className = "text-xs text-gray-400";
  twoFactorDesc.textContent = "Add an extra layer of security to your account";

  twoFactorLabel.appendChild(twoFactorTitle);
  twoFactorLabel.appendChild(twoFactorDesc);

  // Toggle switch
  const toggleSwitch = document.createElement("div");
  toggleSwitch.className = `
    w-12 h-6 rounded-full relative
    bg-[#183B76] border-2 border-[#77AB55] cursor-pointer
    transition-all duration-200 ease-in-out
  `;

  const toggleCircle = document.createElement("div");
  toggleCircle.className = `
    absolute w-4 h-4 bg-[#77AB55] rounded-full
    top-1/2 -translate-y-1/2 left-1
    transition-all duration-200 ease-in-out
  `;

  toggleSwitch.appendChild(toggleCircle);
  toggleSwitch.addEventListener("click", () => {
    const isEnabled = toggleSwitch.classList.contains("enabled");
    if (isEnabled) {
      toggleSwitch.classList.remove("enabled", "bg-[#77AB55]");
      toggleCircle.style.transform = "translate(-0%, -50%)";
      toggleCircle.style.left = "4px";
    } else {
      toggleSwitch.classList.add("enabled", "bg-[#77AB55]");
      toggleCircle.style.transform = "translate(100%, -50%)";
      toggleCircle.style.left = "16px";
    }
  });

  twoFactorGroup.appendChild(twoFactorLabel);
  twoFactorGroup.appendChild(toggleSwitch);
  modal.appendChild(twoFactorGroup);

    // Action buttons
    const actions = document.createElement("div");
  actions.className = `flex items-center justify-end gap-3 mt-4`;
  const saveBtn = document.createElement("button");
  saveBtn.className = `w-[100px] h-[36px] rounded-[8px] bg-[#77AB55] text-white font-pixel font-semibold`;
  saveBtn.textContent = "Save";
  const cancelBtn = document.createElement("button");
  cancelBtn.className = `w-[100px] h-[36px] rounded-[8px] bg-[#2b3b59] text-white font-pixel font-semibold`;
  cancelBtn.textContent = "Cancel";

    saveBtn.addEventListener("click", async () => {
      // Gather form inputs
      const usernameInput = form.querySelector<HTMLInputElement>("input[type='text']");
      const emailInput = form.querySelector<HTMLInputElement>("input[type='email']");
      const oldPasswordInput = form.querySelector<HTMLInputElement>("input[placeholder='Old Password']");
      const newPasswordInput = form.querySelector<HTMLInputElement>("input[placeholder='New Password']");
    
      const data: any = {
        username: usernameInput?.value || undefined,
        newEmail: emailInput?.value || undefined,
        oldPassword: oldPasswordInput?.value || undefined,
        newPassword: newPasswordInput?.value || undefined,
      };
    
      // Call backend
      const response = await this.profileService.updateProfile(data);
    
      if (!response.success) {
        this.showMessage((response.message || "Failed to update profile"), 'error');
        return;
      }
    
      // Success → update UI
      if (response.data.username) this.username = response.data.username;
      if (response.data.email) this.email = response.data.email;
    
      this.fetchProfileData();
      this.showMessage("Profile updated successfully!", 'success');
      setTimeout(() => {
        overlay.remove();
      }, 1000); // waits 1.5s so message is visible
      // overlay.remove(); // close modal
    });

    cancelBtn.addEventListener("click", () => overlay.remove());

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
  private handleAvatarEdit(): void {
    console.log("Change avatar clicked");

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.addEventListener("change", async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Confirmation before upload
          const confirmed = await this.showConfirmation("Set this image as your new avatar?", "Change Avatar", true);
          if (!confirmed) return;
          // Upload to backend
            const response = await this.profileService.uploadAvatar(file);


            if (response.success && response.data) {
                this.avatar = response.data.avatar; // update avatar path
                this.updatePopupAvatar(); 
                this.updateProfileUI(); // refresh UI
                console.log("Avatar updated:", this.avatar);
            } else {
                console.error("Avatar upload failed:", response.message);
                alert(response.message);
            }
        }
    });

    input.click();
  }

  private async handleAvatarDelete(): Promise<void> {
      console.log("Delete avatar clicked");

      // Ask for confirmation
      const confirmed = await this.showConfirmation("Are you sure you want to remove your avatar?", "Remove Avatar", false);
      if (!confirmed) return;
      try {
        const result = await this.profileService.deleteAvatar();
        if (!result.success) {
        }
    
        // Success → reset UI and update avatar field
        this.avatar = result.data?.avatar || ""; // set to default returned by backend
        this.updateProfileUI();
    
      } catch (error) {
        console.error("Network error:", error);
        alert("Network error while removing avatar.");
      }
  }
  private showMessage(message: string, type: 'success' | 'error'): void {
    this.messageContainer.style.display = 'block';
    this.messageContainer.className = `message_container ${type}`;
    this.messageContainer.textContent = message;
    // Auto-hide success messages after 5 seconds
    setTimeout(() => {
      this.messageContainer.style.opacity = '0';
      setTimeout(() => {
          this.messageContainer.style.display = 'none';
          this.messageContainer.style.opacity = '1'; // reset for next use
      }, 300); // wait for fade-out transition
    }, 3000);
    // Scroll to top to show message
  }

  private async showConfirmation(message: string, title = "Please Confirm", action: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "2000";
  
      const modal = document.createElement("div");
      modal.style.background = "var(--color-background-secondary, #fff)";
      modal.style.padding = "1.5rem";
      modal.style.borderRadius = "16px";
      modal.style.width = "320px";
      modal.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      modal.style.textAlign = "center";
      modal.style.transition = "transform 0.2s ease, opacity 0.2s ease";
      modal.style.transform = "scale(1)";
      modal.style.opacity = "1";
  
      const titleEl = document.createElement("h3");
      titleEl.textContent = title;
      titleEl.style.marginTop = "0";
      titleEl.style.marginBottom = "0.5rem";
      titleEl.style.fontSize = "1.1rem";
  
      const messageEl = document.createElement("p");
      messageEl.textContent = message;
      messageEl.style.margin = "1rem 0";
      messageEl.style.fontSize = "0.95rem";
  
      const buttons = document.createElement("div");
      buttons.style.display = "flex";
      buttons.style.justifyContent = "center";
      buttons.style.gap = "1rem";
  
      const yesBtn = document.createElement("button");
      yesBtn.textContent = "Yes";
      yesBtn.style.padding = "0.5rem 1.2rem";
      yesBtn.style.border = "none";
      yesBtn.style.borderRadius = "8px";
      if (action)
        yesBtn.style.backgroundColor = "#4caf50";
      else
        yesBtn.style.backgroundColor = "red";

      yesBtn.style.color = "white";
      yesBtn.style.cursor = "pointer";
      yesBtn.style.fontSize = "0.9rem";
  
      const noBtn = document.createElement("button");
      noBtn.textContent = "Cancel";
      noBtn.style.padding = "0.5rem 1.2rem";
      noBtn.style.border = "none";
      noBtn.style.borderRadius = "8px";
      noBtn.style.backgroundColor = "#ddd";
      noBtn.style.cursor = "pointer";
      noBtn.style.fontSize = "0.9rem";
  
      buttons.appendChild(yesBtn);
      buttons.appendChild(noBtn);
      modal.appendChild(titleEl);
      modal.appendChild(messageEl);
      modal.appendChild(buttons);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
  
      const cleanup = (confirmed: boolean) => {
        modal.style.opacity = "0";
        modal.style.transform = "scale(0.95)";
        setTimeout(() => overlay.remove(), 200);
        resolve(confirmed);
      };
  
      yesBtn.addEventListener("click", () => cleanup(true));
      noBtn.addEventListener("click", () => cleanup(false));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup(false);
      });
      document.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape") cleanup(false);
        },
        { once: true }
      );
    });
  }
  // Public method to refresh the heatmap


  // Public method to refresh the heatmap
  public async refreshHeatmap(): Promise<void> {
    if (this.heatmapContainer) {
      await this.createHeatmap(this.heatmapContainer, 4);
    }
  }

  // Generate a calendar-style heatmap
  private async createHeatmap(container: HTMLElement, monthsToShow: number = 4): Promise<void> {
    container.innerHTML = ""; // clear previous content
    container.className = `rounded-2xl bg-[#21447E] opacity-100 p-4 text-white flex flex-col justify-between `;

    // Grid container
    const monthsGrid = document.createElement("div");
    monthsGrid.className = "grid grid-cols-4 gap-4";
    container.appendChild(monthsGrid);

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    // Compute date range: last `monthsToShow` months ending this month
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of current month
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - (monthsToShow - 1), 1);

    // Fetch play counts for the visible range
    const startISO = startDate.toISOString().slice(0,10);
    const endISO = endDate.toISOString().slice(0,10);
    let dayCounts: Record<string, number> = {};
    try {
      const res = await this.profileService.getPlayCounts(startISO, endISO);
      if (res.success && res.data) {
        res.data.forEach((item: {date: string, count: number}) => { dayCounts[item.date] = item.count; });
      } else {
        console.warn('Failed to fetch play counts', res.message);
      }
    } catch (e) {
      console.warn('Error fetching play counts', e);
    }

    // Build month start dates
    const months: Date[] = [];
    for (let i = 0; i < monthsToShow; i++) {
      months.push(new Date(startDate.getFullYear(), startDate.getMonth() + i, 1));
    }

    // Render each month
    months.forEach((mDate) => {
      const monthIndex = mDate.getMonth();
      const year = mDate.getFullYear();

      const monthContainer = document.createElement("div");
      monthContainer.className = "flex flex-col gap-1";

      const monthTitle = document.createElement("span");
      monthTitle.className = "font-semibold text-center";
      monthTitle.textContent = `${monthNames[monthIndex]} ${year}`;
      monthContainer.appendChild(monthTitle);

      const grid = document.createElement("div");
      grid.className = "grid grid-cols-7 gap-[2px] justify-center";

      const start = new Date(year, monthIndex, 1);
      const end = new Date(year, monthIndex + 1, 0);
      const firstDayOfWeek = start.getDay();

      // Empty cells to align first day
      for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "w-3 h-3 sm:w-4 sm:h-4";
        grid.appendChild(emptyCell);
      }

      for (let d = 1; d <= end.getDate(); d++) {
        const cell = document.createElement("div");
        const cellDate = new Date(year, monthIndex, d);
        const y = cellDate.getFullYear();
        const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
        const dd = String(cellDate.getDate()).padStart(2, '0');
        const key = `${y}-${mm}-${dd}`;
        const count = (dayCounts && dayCounts[key]) ? dayCounts[key] : 0;

        const getColor = (c: number) => {
          // dark if didn't play, lighter for 1, lighter for 2, white if >2
          if (c <= 0) return "bg-[#183B76]";      // dark when no plays
          if (c === 1) return "bg-[#1F4D9A]";     // medium
          if (c === 2) return "bg-[#99B5E5]";     // light
          return "bg-white";                      // very light / white for 3+
        };

        cell.className = `w-5 h-5 sm:w-6 sm:h-6 rounded ${getColor(count)} transition hover:scale-110 flex items-center justify-center`;
        cell.title = `${monthNames[monthIndex]} ${d}, ${year} — ${count} plays`;
        const dateText = document.createElement("span");
        dateText.textContent = String(d);
        dateText.className = "text-[0.5rem] sm:text-[0.6rem] opacity-60";
        cell.appendChild(dateText);
        grid.appendChild(cell);
      }

      monthContainer.appendChild(grid);
      monthsGrid.appendChild(monthContainer);
    });

    // "Learn More" button — navigate to dashboard page
    const button = document.createElement("button");
    button.textContent = ">> Learn More";
    button.className = `
       absolute bottom-4 right-4
                w-[190px] h-[32px]
                rounded-[7px]
                px-[10px] py-[6px] font-pixel
                text-color_white
                border border-[1px] border-border-green
                inline-flex justify-center items-center
                no-underline cursor-pointer
                transition-colors duration-200 ease-in-out
                hover:bg-color-green
                hover:text-color_white
    `;
    button.addEventListener("click", () => {
      // navigate to dashboard route
      history.pushState(null, '', '/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    container.style.position = "relative";
    container.appendChild(button);
  }



  
}