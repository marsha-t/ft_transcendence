import { IComponent } from "../components/IComponent";
import { ProfileServices } from '../services/profile/ProfileServices.js';
import { ProfileData, FriendsData, AvatarUploadResponse, AvatarDeleteResponse, UserSearchResult, FriendRequest, ApiResponse } from '../services/profile/types';

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
  private popupAvatarEl: HTMLElement | null = null;
  private requestsListData: FriendRequest[] = [];
  private profileService: ProfileServices;
  private messageContainer!: HTMLDivElement;
  private container!: HTMLElement;
  



  constructor() {
      this.profileService = new ProfileServices();
  }

  public render():  HTMLElement {
    this.container = document.createElement("div");
    this.container.className = "profile-page";


    this.loadPageStyles();


    // Profile card
    // ***************************************
    const card = document.createElement("div");
    card.className = "profile-card";

    const avatar = document.createElement("div");
    avatar.className = "profile-avatar";

    const name = document.createElement("h2");
    name.className = "profile-name";
    name.textContent = this.username  || "Hi Test!";

    const status = document.createElement("p");
    status.className = "profile-status online";
    status.innerHTML = "Online"; // Using innerHTML for the dot

    const settingsBtn = document.createElement("img");
    settingsBtn.src = "/assets/icons/gear.svg";
    settingsBtn.alt = "profile settings";
    settingsBtn.className = `
    absolute top-[28px] left-[1009px] 
    w-[30px] h-[30px]
    text-[#5D5A88]
    cursor-pointer
    inline-flex items-center justify-center
    transition duration-200
    hover:brightness-90 hover:text-[#d32f2f]`;
    settingsBtn.addEventListener("click", () => this.openSettingsPopup());
    card.appendChild(avatar);
    card.appendChild(name);
    card.appendChild(status);
    card.appendChild(settingsBtn);


// ----------------------------------------------------------------------------------------------

    // Stats
    // ***************************************
    const winsValue = "15";  //backend
    const lossesValue = "10"; //backend
    const rankValue = "3"; //backend
    const stats = document.createElement("div");
    stats.className = "stats";
    const label = document.createElement("div");
    label.className = "stats-label";
    label.textContent = "Stats";
    stats.appendChild(label);

    const wins = this.createStat(winsValue, "Wins", "stat-wins");
    const losses = this.createStat(lossesValue, "Losses", "stat-losses");
    const rank = this.createStat(rankValue, "Rank", "stat-rank");

    stats.appendChild(wins);
    stats.appendChild(losses);
    stats.appendChild(rank);

// ----------------------------------------------------------------------------------------------

  // Friends
  // ***************************************
    const friends = document.createElement("div");
    friends.className = "friends";

    const friendsHeader = document.createElement("div");
    friendsHeader.className = "friends-header";

    const friendsTitle = document.createElement("h3");
    friendsTitle.className = this.isFriendsActive ? "active" : "";
    friendsTitle.textContent = "Friends";
    friendsTitle.addEventListener("click", () => this.switchToFriends());

    const requestTitle = document.createElement("h4");
    requestTitle.className = !this.isFriendsActive ? "active" : "";
    requestTitle.textContent = "Request";
    requestTitle.addEventListener("click", () => this.switchToRequests());

    const addFriendBtn = document.createElement("button");
    addFriendBtn.addEventListener("click", () => this.openAddFriendPopup());
    addFriendBtn.className = "search-btn";
    const addFriendText = document.createElement("span");
    addFriendText.textContent = "Add Friend";
    addFriendBtn.appendChild(addFriendText);

    friendsHeader.appendChild(friendsTitle);
    friendsHeader.appendChild(requestTitle);
    friendsHeader.appendChild(addFriendBtn);

    // Conditionally render friends or requests list
    const friendsList = document.createElement("div");
    friendsList.className = "friends-list";
    this.switchToFriends();
    friends.appendChild(friendsHeader);
    friends.appendChild(friendsList);


// ----------------------------------------------------------------------------------------------

    // Match history
    // ***************************************
    const matchHistory = document.createElement("div");
    matchHistory.className = "match-history";

    const matchTitle = document.createElement("h3");
    matchTitle.textContent = "Match History";
    matchHistory.appendChild(matchTitle);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Opponent</th>
        <th>Result</th>
        <th>Score</th>
        <th>Date</th>
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    tbody.appendChild(this.createMatch("John Doe", "Win", "5 - 3", "Oct 26, 2025"));
    tbody.appendChild(this.createMatch("John Doe", "Win", "5 - 3", "Oct 26, 2025"));
    tbody.appendChild(this.createMatch("John Doe", "Win", "5 - 3", "Oct 26, 2025"));
    tbody.appendChild(this.createMatch("John Doe", "Win", "5 - 3", "Oct 26, 2025"));
    tbody.appendChild(this.createMatch("John Doe", "Win", "5 - 3", "Oct 26, 2025"));

    table.appendChild(tbody);
    matchHistory.appendChild(table);

    // Append everything
    this.container.appendChild(card);
    this.container.appendChild(stats);
    this.container.appendChild(friends);
    this.container.appendChild(matchHistory);

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

  private loadPageStyles(): void {
    if (document.getElementById("profile-styles")) return;

    const link = document.createElement("link");
    link.id = "profile-styles";
    link.rel = "stylesheet";
    link.href = "/styles/Profile.css";
    document.head.appendChild(link);
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
  item.className = "friend-item";

  const inner = document.createElement("div");
  inner.className = "friend-item-inner";

  // Frame for avatar + name
  const profileText = document.createElement("div");
  profileText.className = "friend-profile-text";

  const avatar = document.createElement("div");
  avatar.className = "friend-avatar";

  // Use background-image for the avatar
  const backendUrl = "http://localhost:5001"; // same as how the profile picture is being shown
  avatar.style.backgroundImage = `url(${backendUrl}${avatarURL})`;
  avatar.style.backgroundSize = "cover";
  avatar.style.backgroundPosition = "center";
  avatar.textContent = ""; // clear any fallback text

  const friendName = document.createElement("span");
  friendName.className = "friend-name";
  friendName.textContent = name;

  profileText.appendChild(avatar);
  profileText.appendChild(friendName);

  // Status circle
  const status = document.createElement("span");
  status.className = `friend-status ${online ? "online" : "offline"}`;

  
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-friend";
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

  inner.appendChild(profileText);
  inner.appendChild(removeBtn);
  inner.appendChild(status); // outside profileText
  item.appendChild(inner);

  return item;
}

  // ----------------------------------------------------------------------------------------------

// ***************************************
// match history
  private createMatch(opponent: string, result: "Win" | "Loss", score: string, date: string): HTMLElement {
    const row = document.createElement("tr");

    const opponentCell = document.createElement("td");
    opponentCell.textContent = opponent;

    const resultCell = document.createElement("td");
    resultCell.className = `match-result ${result === "Win" ? "win" : "loss"}`;
    resultCell.textContent = result;

    const scoreCell = document.createElement("td");
    scoreCell.textContent = score;

    const dateCell = document.createElement("td");
    dateCell.textContent = date;

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
    item.className = "request-item";

    const inner = document.createElement("div");
    inner.className = "request-item-inner";

    // Avatar + Username
    const profileText = document.createElement("div");
    profileText.className = "request-profile-text";

    const avatar = document.createElement("div");
    avatar.className = "request-avatar";
    const backendUrl = "http://localhost:5001"; // same as how the profile picture is being shown
    avatar.style.backgroundImage = `url(${backendUrl}${avatarURL})`;
    avatar.style.backgroundSize = "cover";
    avatar.style.backgroundPosition = "center";
    avatar.textContent = ""

    const userName = document.createElement("span");
    userName.className = "request-name";
    userName.textContent = name;

    profileText.appendChild(avatar);
    profileText.appendChild(userName);

    // Buttons
    const buttons = document.createElement("div");
    buttons.className = "request-buttons";
    const profileServices = this.profileService;
    const acceptBtn = document.createElement("button");
    acceptBtn.className = "accept-btn";
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
    declineBtn.className = "decline-btn";
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
    const friendsList = this.container.querySelector(".friends-list");
    if (!friendsList) return;

    // Clear current items
    friendsList.innerHTML = "";

    // Add new items
    if (this.isFriendsActive) {
        this.friendsListData.forEach(f =>
            friendsList.appendChild(this.createFriend(f.avatarURL, f.name, f.online))
        );
    } else {
      this.requestsListData.forEach(r => {
        if (!r.from) return; // safety check
        friendsList.appendChild(
            this.createRequest(r.from.avatar, r.from.username, r.id)
        );
    });
    }

    // Update active class for tabs
    const friendsTitle = this.container.querySelector("h3")!;
    const requestTitle = this.container.querySelector("h4")!;
    friendsTitle.className = this.isFriendsActive ? "active" : "";
    requestTitle.className = this.isFriendsActive ? "" : "active";
}



//-----------------------
 // ***************************************
 // profile
private async fetchProfileData(): Promise<void> {
  this.setLoadingState(true);
  try {
      const profileResponse: ApiResponse<ProfileData> = await this.profileService.getProfile();
      if (profileResponse.success) {
          this.username = profileResponse.data?.username || "Hi Test!";
          this.email = profileResponse.data?.email || "test@email.com";
          this.avatar = profileResponse.data?.avatar || "";
          this.updateProfileUI();
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
  } catch (error: any) {
      console.error('Error fetching profile data:', error);
      this.username = "Hi Test!";
      this.avatar = ""; 
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
    nameEl.textContent = this.username || "Hi Test!";
  
    // Update avatar
    if (this.avatar) {
      const backendUrl = "http://localhost:5001";
      avatarEl.style.backgroundImage = `url(${backendUrl}${this.avatar})`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
      avatarEl.textContent = "";
    }
    else {
      avatarEl.style.backgroundImage = "";
      avatarEl.textContent = this.username.charAt(0).toUpperCase() || "";
    }
  }
  
  // Method to update the avatar in the settings's page once it gets changed
  private updatePopupAvatar(): void {
    if (!this.popupAvatarEl) return;
  
    const backendUrl = "http://localhost:5001";
  
    if (this.avatar) {
      this.popupAvatarEl.style.backgroundImage = `url(${backendUrl}${this.avatar})`;
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
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";

  const header = document.createElement("div");
  header.className = "search-header";

  const title = document.createElement("h2");
  title.textContent = "Search for Users";

  const closeBtn = document.createElement("button");
  closeBtn.className = "close-btn";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => overlay.remove());

  header.appendChild(title);
  header.appendChild(closeBtn);

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search username...";
  searchInput.className = "search-input";

  const resultsContainer = document.createElement("div");
  resultsContainer.className = "search-results";

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

    data.forEach((user) => {
      console.log(`${user.username}: ${user.friendStatus}`);
      const userDiv = document.createElement("div");
      userDiv.className = "search-item";

      const avatar = document.createElement("div");
      avatar.style.backgroundImage = `url(${backendUrl}${user.avatar})`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.className = "search-userAvatar";

      const name = document.createElement("span");
      name.className = "search-username";
      name.textContent = user.username;

      const action = document.createElement("div");
      action.className = "search-action";

      const isPending =
        user.friendStatus === "pending_sent" || localPending.has(user.username);

      if (isPending) {
        const pendingLabel = document.createElement("span");
        pendingLabel.textContent = "Pending";
        pendingLabel.className = "pending-label";
        action.appendChild(pendingLabel);
      } else {
        const addBtn = document.createElement("button");
        addBtn.textContent = "Add Friend";
        addBtn.className = "addFriend-btn";

        addBtn.addEventListener("click", async () => {
          const res = await service.sendFriendRequest(user.username);
          if (res.success) {
            localPending.add(user.username);
            // Swap the button for a non-interactive Pending label immediately
            const pendingLabel = document.createElement("span");
            pendingLabel.textContent = "Pending";
            pendingLabel.className = "pending-label";
            action.innerHTML = "";
            action.appendChild(pendingLabel);
          } else {
            this.showMessage((res.message || "Failed to send friend request"), 'error');
          }
        });

        action.appendChild(addBtn);
      }

      userDiv.appendChild(avatar);
      userDiv.appendChild(name);
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
    overlay.className = "modal-overlay";
    //Create message container for success/error messages
    const modal = document.createElement("div");
    modal.className = "modal";
    
    const header = document.createElement("div");
    header.className = "modal-header";
    
    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "&times;"; // HTML  '×'
    closeBtn.addEventListener("click", () => overlay.remove());
    
    this.messageContainer = document.createElement('div');
    this.messageContainer.className = 'message_container';
    this.messageContainer.style.display = 'none';
    modal.appendChild(this.messageContainer);
  
    // Avatar section
    const avatarSection = document.createElement("div");
    avatarSection.className = "settings-avatar";
    const avatarPlaceholder = document.createElement("div");
    avatarPlaceholder.className = "avatar-placeholder";
    if (this.avatar) {
      const backendUrl = "http://localhost:5001";
      avatarPlaceholder.style.backgroundImage = `url(${backendUrl}${this.avatar})`;
      avatarPlaceholder.style.backgroundSize = "cover";
      avatarPlaceholder.style.backgroundPosition = "center";
    } else {
        avatarPlaceholder.textContent = this.username.charAt(0).toUpperCase() || "";
    }

    this.popupAvatarEl = avatarPlaceholder;

   // Pen icon (edit)
    const penIcon = document.createElement("img");
    penIcon.src = "/assets/icons/pen.svg";
    penIcon.alt = "Edit avatar";
    penIcon.className = `absolute top-[172px] left-[230px] 
      w-[20px] h-[20px]
      text-[#5D5A88]
      cursor-pointer
      inline-flex items-center justify-center
      transition duration-200
      hover:brightness-90 hover:text-[#297138]`;
    penIcon.addEventListener("click", () => this.handleAvatarEdit());

    // Trash icon (delete)
    const trashIcon = document.createElement("img");
    trashIcon.src = "/assets/icons/trash.svg";
    trashIcon.alt = "Delete avatar";
    trashIcon.className = `
    absolute top-[172px] left-[307px] 
    w-[20px] h-[20px]
    text-[#5D5A88]
    cursor-pointer
    inline-flex items-center justify-center
    transition duration-200
    hover:brightness-90 hover:text-[#d32f2f]`;    
    trashIcon.addEventListener("click", () => this.handleAvatarDelete());


    avatarSection.appendChild(avatarPlaceholder);
    avatarSection.appendChild(penIcon);
    avatarSection.appendChild(trashIcon);

    header.appendChild(closeBtn);
    header.appendChild(avatarSection);

    modal.appendChild(header);

    // Form fields
    const form = document.createElement("div");
  form.className = "settings-form";

  // === Username ===
  const usernameGroup = document.createElement("div");
  usernameGroup.className = "form-group";

  const usernameLabel = document.createElement("label");
  usernameLabel.className = "form-label";
  usernameLabel.textContent = "Username";

  const usernameInput = document.createElement("input");
  usernameInput.type = "text";
  usernameInput.className = "modal-input";
  usernameInput.placeholder = this.username || "";

  usernameGroup.appendChild(usernameLabel);
  usernameGroup.appendChild(usernameInput);

  // === Email ===
  const emailGroup = document.createElement("div");
  emailGroup.className = "form-group";

  const emailLabel = document.createElement("label");
  emailLabel.className = "form-label";
  emailLabel.textContent = "Email";

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.className = "modal-input";
  emailInput.placeholder = this.email || "";

  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);

  // === Password ===
  const passwordGroup = document.createElement("div");
  passwordGroup.className = "form-group";

  const passwordLabel = document.createElement("label");
  passwordLabel.className = "form-label";
  passwordLabel.textContent = "Password";

  const oldPasswordInput = document.createElement("input");
  oldPasswordInput.type = "password";
  oldPasswordInput.placeholder = "Old Password";
  oldPasswordInput.className = "modal-input";

  const newPasswordInput = document.createElement("input");
  newPasswordInput.type = "password";
  newPasswordInput.placeholder = "New Password";
  newPasswordInput.className = "modal-input";

  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(oldPasswordInput);
  passwordGroup.appendChild(newPasswordInput);

  // === Append groups ===
  form.appendChild(usernameGroup);
  form.appendChild(emailGroup);
  form.appendChild(passwordGroup);

  modal.appendChild(form);


    // Action buttons
    const actions = document.createElement("div");
    actions.className = "modal-actions";
    const saveBtn = document.createElement("button");
    saveBtn.className = "save-btn";
    saveBtn.textContent = "Save";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel-btn";
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
          this.showMessage((result.message || "Failed to remove avatar"), 'error');
          return;
        }
    
        // Success → reset UI and update avatar field
        this.avatar = result.data?.avatar || ""; // set to default returned by backend
        this.updatePopupAvatar(); 
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
  
}