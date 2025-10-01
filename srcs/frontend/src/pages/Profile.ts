import { IComponent } from "../components/IComponent";
import { ProfileServices } from '../services/profile/ProfileServices.js';
// import { apiServices } from '../services/ApiServices';
import { ProfileData, ApiResponse } from "../services/profile/types";
export class Profile implements IComponent {
  private isFriendsActive: boolean = true;
  private username: string = "";
  private avatar: string = "";
  private isLoading: boolean = false;
  private profileService: ProfileServices;
  private container!: HTMLElement;

  constructor() {
      this.profileService = new ProfileServices();
  }

  public render():  HTMLElement {
    this.container = document.createElement("div");
    this.container.className = "profile-page";

    // await this.fetchProfileData();
    this.loadPageStyles();

    // Profile card
    const card = document.createElement("div");
    card.className = "profile-card";

    const avatar = document.createElement("div");
    avatar.className = "profile-avatar";

    if (this.avatar) {
      const backendUrl = "http://localhost:5001"; // put this in a config file ideally
      avatar.style.backgroundImage = `url(${backendUrl}${this.avatar})`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
    } else {
      avatar.textContent = this.username.charAt(0) || "AV"; // Fallback to initials
    }

    const name = document.createElement("h2");
    name.className = "profile-name";
    name.textContent = this.username  || "Hi Test!";

    const status = document.createElement("p");
    status.className = "profile-status online";
    status.innerHTML = "Online"; // Using innerHTML for the dot

    const settingsBtn = document.createElement("button");
    settingsBtn.className = "settings-btn";
    settingsBtn.innerHTML = "&#9881;"; // Gear icon using HTML entity
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
    if (this.isFriendsActive) {
      friendsList.appendChild(this.createFriend("TF", "Test's friend", true));
      friendsList.appendChild(this.createFriend("JD", "John Doe", false));
      friendsList.appendChild(this.createFriend("TU", "Test User", true));
      friendsList.appendChild(this.createFriend("JD", "Joey Doe", false));

    } else {
      friendsList.appendChild(this.createRequest("RF", "Random Friend"));
      friendsList.appendChild(this.createRequest("AF", "Another Friend"));
      friendsList.appendChild(this.createRequest("RF", "Random Friend"));
      friendsList.appendChild(this.createRequest("AF", "Another Friend"));
    }
    friends.appendChild(friendsHeader);
    friends.appendChild(friendsList);

    // friends.appendChild(this.createFriend("JD", "John Doe", true));

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
    // tbody.appendChild(this.createMatch("John Doe", "Win", "5 - 3", "Oct 26, 2025"));

    table.appendChild(tbody);
    matchHistory.appendChild(table);

    // Append everything
    this.container.appendChild(card);
    this.container.appendChild(stats);
    this.container.appendChild(friends);
    this.container.appendChild(matchHistory);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
          if (mutation.addedNodes.length && this.container.parentElement) {
              console.log("Component added to DOM, fetching profile data...");
              this.fetchProfileData();
              observer.disconnect(); // Stop observing after the first fetch
          }
      });
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


private createFriend(initials: string, name: string, online: boolean): HTMLElement {
  const item = document.createElement("div");
  item.className = "friend-item";

  const inner = document.createElement("div");
  inner.className = "friend-item-inner";

  // Frame for avatar + name
  const profileText = document.createElement("div");
  profileText.className = "friend-profile-text";

  const avatar = document.createElement("div");
  avatar.className = "friend-avatar";
  avatar.textContent = initials;

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

private createRequest(initials: string, name: string): HTMLElement {
  const item = document.createElement("div");
  item.className = "request-item";

  const inner = document.createElement("div");
  inner.className = "request-item-inner";

  // Avatar + Username
  const profileText = document.createElement("div");
  profileText.className = "request-profile-text";

  const avatar = document.createElement("div");
  avatar.className = "request-avatar";
  avatar.textContent = initials;

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
    // handle accept logic here
  });

  const declineBtn = document.createElement("button");
  declineBtn.className = "decline-btn";
  declineBtn.textContent = "Decline";
  declineBtn.addEventListener("click", () => {
    console.log(`Declined friend request from ${name}`);
    // handle decline logic here
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
    this.rerender();
  }

  private switchToRequests(): void {
    this.isFriendsActive = false;
    this.rerender();
  }

   private rerender(): void {
    const parent = document.querySelector(".profile-page");
    if (parent) {
      const newContainer = this.render();
      parent.replaceWith(newContainer);
    }
  }


//-----------------------

private async fetchProfileData(): Promise<void> {
  this.setLoadingState(true);
  try {
      const response: ApiResponse<ProfileData> = await this.profileService.getProfile();
      if (response.success) {
          this.username = response.data?.username || "Hi Test!";
          this.avatar = response.data?.avatar || "";
          // this.rerender(); // Re-render to reflect updated data
          this.updateProfileUI();
      } else {
          this.username = response.data?.username || "Hi Test!";
          this.avatar = response.data?.avatar || "";
          // this.rerender(); // Re-render to reflect updated data
          this.updateProfileUI();
          // throw new Error(response.message || "Failed to load profile data");
      }
  } catch (error: any) {
      console.error('Error fetching profile data:', error);
      this.username = "Hi Test!"; // Fallback username
      this.avatar = ""; // No avatar on error
      // this.rerender(); // Re-render with fallback data
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
  const name = this.container.querySelector(".profile-name");
  const avatar = this.container.querySelector(".profile-avatar");

  if (name) name.textContent = this.username || "Hi Test!";
  if (avatar) {
    if (this.avatar) {
      (avatar as HTMLElement).style.backgroundImage = `url(${this.avatar})`;
      avatar.textContent = "";
    } else {
      (avatar as HTMLElement).style.backgroundImage = "";
      avatar.textContent = this.username.charAt(0).toUpperCase() || "AV";
    }
  }
}

//-------------------------

private openAddFriendPopup(): void {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const header = document.createElement("div");
    header.className = "modal-header";

    const title = document.createElement("h2");
    title.textContent = "Add Friend";

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => overlay.remove());

    header.appendChild(title);
    header.appendChild(closeBtn);

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search username...";
    searchInput.className = "modal-input";

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
    closeBtn.innerHTML = "&times;"; // HTML entity for '×'
    closeBtn.addEventListener("click", () => overlay.remove());

    // Avatar section
    const avatarSection = document.createElement("div");
    avatarSection.className = "settings-avatar";
    const avatarPlaceholder = document.createElement("div");
    avatarPlaceholder.className = "avatar-placeholder";
    // avatarPlaceholder.textContent = "AV"; // Placeholder initials
    // Pen icon (for editing)
    const penIcon = document.createElement("span");
    penIcon.className = "pen-icon";
    penIcon.innerHTML = "&#9998;"; // Pen Unicode
    penIcon.addEventListener("click", () => this.handleAvatarEdit());

    // Trash icon (for deleting avatar)
    const trashIcon = document.createElement("span");
    trashIcon.className = "trash-icon";
    trashIcon.innerHTML = "&#128465;"; // Trash Unicode
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
    input.addEventListener("change", (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.avatar = event.target?.result as string; // Update avatar
                this.rerender(); // Re-render to show new avatar
            };
            reader.readAsDataURL(file);
        }
    });
    input.click();
  }


  private handleAvatarDelete(): void {
    console.log("Delete avatar clicked");
    this.avatar = ""; // Clear avatar
    this.rerender(); // Re-render to show placeholder
  }
  
}