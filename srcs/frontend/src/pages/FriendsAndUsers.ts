import { IComponent } from "../components/IComponent";
import { apiServices } from '../services/ApiServices.js';
import { ApiResponse, FriendsData, UserSearchResult, FriendRequest } from '../services/profile/types'; 
import { getAvatarUrl, showMessage } from "../utils/profileUtils.js";

export class friendsAndUsers implements IComponent {
    private container!: HTMLElement;
    private isFriendsActive: boolean = true;
    private friendsListData: Array<{ avatarURL: string; name: string; online: boolean }> = []
    private requestsListData: FriendRequest[] = [];
    private onProfileUpdate?: () => void;
    
    constructor(onProfileUpdate?: () => void) {
        this.onProfileUpdate = onProfileUpdate;
    }


    render(): HTMLElement {
  const friends = document.createElement("div");
  friends.className = `
    rounded-2xl bg-[#21447E] opacity-100 p-4 text-white
    min-h-0 overflow-hidden
  `;
  this.container = friends;

  const friendsHeader = document.createElement("div");
  friendsHeader.className = `
    w-full h-[80px] p-2 font-pixel font-[400]
    text-color_white flex items-center justify-between
    gap-[58px] text-[16px] font-semibold text-white
    my-[10px] border-b border-gray-500
  `;

  // --- Tabs ---
  const friendsTitle = document.createElement("button");
  friendsTitle.className = `
    friends-tab text-[18px] font-semibold cursor-pointer
    hover:text-[--color-button]
  `;
  friendsTitle.textContent = "Friends";

  const requestTitle = document.createElement("button");
  requestTitle.className = `
    requests-tab text-[18px] font-semibold cursor-pointer
    hover:text-[--color-button]
  `;
  requestTitle.textContent = "Requests";

  // --- Set active style ---
  const setActive = (active: "friends" | "requests") => {
    if (active === "friends") {
      friendsTitle.classList.add("text-[#77AB55]", "font-bold");
      requestTitle.classList.remove("text-[#77AB55]", "font-bold");
    } else {
      requestTitle.classList.add("text-[#77AB55]", "font-bold");
      friendsTitle.classList.remove("text-[#77AB55]", "font-bold");
    }
  };

  // --- Event Listeners ---
  friendsTitle.addEventListener("click", () => {
    this.switchToFriends();
    setActive("friends");
  });

  requestTitle.addEventListener("click", () => {
    this.switchToRequests();
    setActive("requests");
  });

  // --- Add Friend button ---
  const addFriendBtn = document.createElement("button");
  addFriendBtn.className = `
    w-[140px] flex justify-center items-center
    text-[16px] font-pixel font-semibold
    border border-[#77AB55] rounded-[7px]
    gap-[6px] hover:bg-[#77AB55] hover:text-white
    transition-all duration-200
  `;
  addFriendBtn.textContent = "Add Friend";
  addFriendBtn.addEventListener("click", () => this.openAddFriendPopup());

  // --- Assemble Header ---
  friendsHeader.appendChild(friendsTitle);
  friendsHeader.appendChild(requestTitle);
  friendsHeader.appendChild(addFriendBtn);

  // --- List container ---
  const friendsList = document.createElement("div");
  friendsList.className = `
    friends-list flex flex-col gap-3 w-full mt-4
    max-h-[400px] px-2 scrollbar-thin
    scrollbar-thumb-[#77AB55] scrollbar-track-[#21447E]
  `;
  friendsList.style.overflowY = "auto";
  friendsList.style.maxHeight = "calc(100% - 80px)";

  friends.appendChild(friendsHeader);
  friends.appendChild(friendsList);

  this.isFriendsActive = true;
  setActive("friends");

  // --- Fetch data after render ---
  this.fetchProfileData().then(() => {
    this.updateFriendsList();
  });

  return friends; // ✅ Return for integration
}

  private async fetchProfileData(): Promise<void> {
    try {
      const friendsResponse: ApiResponse<FriendsData> = await apiServices.profile.getFriends();
      if (friendsResponse.success) {
        this.friendsListData = friendsResponse.data?.friends || [];
      }

      const requestsResponse = await apiServices.profile.getIncomingRequests();
      if (requestsResponse.success && requestsResponse.data) {
        this.requestsListData = requestsResponse.data;
      }
    } catch (error) {
      console.error("Error fetching friends/requests data:", error);
    }
  }

  public async fetchData(): Promise<void> {
    await this.fetchProfileData();
    this.updateFriendsList();
  }

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
  avatar.style.backgroundImage = `url(${getAvatarUrl(avatarURL)})`;
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

  removeBtn.addEventListener("click", async () => {
    const response = await apiServices.profile.removeFriend(name);
    console.log("API response:", response);
    if (response.success) {
      item.remove(); // Remove from UI
      console.log(`${name} removed successfully`);
      await this.fetchProfileData();
      this.switchToFriends(); // ✅ use captured instance
      if (this.onProfileUpdate) {
        this.onProfileUpdate();
      }
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
  avatar.style.backgroundImage = `url(${getAvatarUrl(avatarURL)})`;
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
      const res = await apiServices.profile.respondToRequest(name, "accept");
      if (res.success) {
        console.log(`✅ Accepted friend request from ${name}`);
        item.remove(); // Remove from UI
        const friendsResponse: ApiResponse<FriendsData> = await apiServices.profile.getFriends();
        if (friendsResponse.success) {
            this.friendsListData = friendsResponse.data?.friends || [];
            await this.fetchProfileData();
            this.switchToRequests();
          }
        if (this.onProfileUpdate) {
          this.onProfileUpdate();
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
    const res = await apiServices.profile.respondToRequest(name, "reject");
    if (res.success) {
        console.log(`❌ Declined friend request from ${name}`);
        item.remove(); // Remove from UI
        await this.fetchProfileData();
        this.switchToRequests();
        if (this.onProfileUpdate) {
          this.onProfileUpdate();
        }
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
      avatar.style.backgroundImage = `url(${getAvatarUrl(user.avatar)})`;
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
          const res = await apiServices.profile.sendFriendRequest(user.username);
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
            showMessage((res.message || "Failed to send friend request"), 'error');
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
      const response = await apiServices.profile.searchUsers(query);
      if (response.success && response.data) renderResults(response.data);
      else resultsContainer.innerHTML = "<p class='no-results'>No users found</p>";
    }, debounceDelay);
  });
}

}