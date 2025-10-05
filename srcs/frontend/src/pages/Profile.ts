import { IComponent } from "../components/IComponent";
import { ProfileServices } from '../services/profile/ProfileServices.js';
import { ProfileData, ApiResponse, FriendsData } from "../services/profile/types";

export class Profile implements IComponent {
  private isFriendsActive: boolean = true;
  private username: string = "";
  private email: string = "";
  private avatar: string = "";
  private friendsListData: { avatarURL: string; name: string; online: boolean }[] = [];
  // private requestsListData: { initials: string; name: string }[] = [];
  private isLoading: boolean = false;
  private profileService: ProfileServices;
  private container!: HTMLElement;

  constructor() {
      this.profileService = new ProfileServices();
  }

  public render():  HTMLElement {
    this.container = document.createElement("div");
    this.container.className = "profile-page";


    this.loadPageStyles();

    // Profile card
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

    const settingsBtn = document.createElement("button");
    settingsBtn.className = "settings-btn";
    settingsBtn.innerHTML = "&#9881;";
    settingsBtn.addEventListener("click", () => this.openSettingsPopup());
    card.appendChild(avatar);
    card.appendChild(name);
    card.appendChild(status);
    card.appendChild(settingsBtn);


// ----------------------------------------------------------------------------------------------

    // Stats
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
    addFriendBtn.className = "add-friend-btn";
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

  inner.appendChild(profileText);
  inner.appendChild(status); // outside profileText
  item.appendChild(inner);

  return item;
}

  // ----------------------------------------------------------------------------------------------


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

  private createRequest(avatarURL: string, name: string): HTMLElement {
    const item = document.createElement("div");
    item.className = "request-item";

    const inner = document.createElement("div");
    inner.className = "request-item-inner";

    // Avatar + Username
    const profileText = document.createElement("div");
    profileText.className = "request-profile-text";

    const avatar = document.createElement("div");
    avatar.className = "request-avatar";
    avatar.textContent = avatarURL;

    const userName = document.createElement("span");
    userName.className = "request-name";
    userName.textContent = name;

    profileText.appendChild(avatar);
    profileText.appendChild(userName);

    // Buttons
    const buttons = document.createElement("div");
    buttons.className = "request-buttons";

    const acceptBtn = document.createElement("button");
    acceptBtn.className = "accept-btn";
    acceptBtn.textContent = "Accept";
    acceptBtn.addEventListener("click", () => {
      console.log(`Accepted friend request from ${name}`);
      // handle accept logic !!!
    });

    const declineBtn = document.createElement("button");
    declineBtn.className = "decline-btn";
    declineBtn.textContent = "Decline";
    declineBtn.addEventListener("click", () => {
      console.log(`Declined friend request from ${name}`);
      // handle decline logic !!!!
    });

    buttons.appendChild(acceptBtn);
    buttons.appendChild(declineBtn);

    inner.appendChild(profileText);
    inner.appendChild(buttons);
    item.appendChild(inner);

    return item;
  }


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
        // this.requestsListData.forEach(r =>
        //     friendsList.appendChild(this.createRequest(r.initials, r.name))
        // );
        friendsList.appendChild(this.createRequest("JD", "John Doe"));
    }

    // Update active class for tabs
    const friendsTitle = this.container.querySelector("h3")!;
    const requestTitle = this.container.querySelector("h4")!;
    friendsTitle.className = this.isFriendsActive ? "active" : "";
    requestTitle.className = this.isFriendsActive ? "" : "active";
}



//-----------------------

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
          this.updateProfileUI();
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
    this.isLoading = loading;
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
      avatarEl.textContent = this.username.charAt(0).toUpperCase() || "AV";
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
    title.textContent = " Search for Users";

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "&times;"; // HTML  '×'
    closeBtn.addEventListener("click", () => overlay.remove());

    header.appendChild(title);
    header.appendChild(closeBtn);

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search username...";
    searchInput.className = "search-input";

    modal.appendChild(header);
    modal.appendChild(searchInput);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  private openSettingsPopup(): void {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const header = document.createElement("div");
    header.className = "modal-header";

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "&times;"; // HTML  '×'
    closeBtn.addEventListener("click", () => overlay.remove());

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
        avatarPlaceholder.textContent = this.username.charAt(0).toUpperCase() || "AV";
    }
    // avatarPlaceholder.textContent = "AV"; // Placeholder initials
    // Pen icon (for editing)
    const penIcon = document.createElement("span");
    penIcon.className = "pen-icon";
    penIcon.innerHTML = `<i class="fa-solid fa-pen"></i>`; // Pen Unicode
    penIcon.addEventListener("click", () => this.handleAvatarEdit());

    // Trash icon (for deleting avatar)
    
    const trashIcon = document.createElement("span");
    trashIcon.className = "trash-icon";
    trashIcon.innerHTML = `<i class="fa-solid fa-trash"></i>`; 
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
  usernameInput.value = this.username || "";

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
  emailInput.value = this.email || "";

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

    // saveBtn.addEventListener("click", () => {
    //     const inputs = form.getElementsByClassName("modal-input") as HTMLCollectionOf<HTMLInputElement>;
    //     const data = {};
    //     for (let input of inputs) {
    //         data[input.placeholder.toLowerCase()] = input.value;
    //     }
    //     console.log("Saved data:", data);
    //     overlay.remove(); // Close on save (add API call if needed)
    // });

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
            // Upload to backend
            const response = await this.profileService.uploadAvatar(file);

            if (response.success && response.data) {
                this.avatar = response.data.avatar; // update avatar path
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
      if (!confirm("Are you sure you want to remove your avatar?")) return;

      try {
        const result = await this.profileService.deleteAvatar();

        if (!result.success) {
          alert(result.message || "Failed to remove avatar");
          return;
        }
    
        // Success → reset UI and update avatar field
        this.avatar = result.data?.avatar || ""; // set to default returned by backend
        this.updateProfileUI();
    
      } catch (error) {
        console.error("Network error:", error);
        alert("Network error while removing avatar.");
      }
  }
  
}