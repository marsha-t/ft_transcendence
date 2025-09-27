import { IComponent } from "../components/IComponent";

export class Profile implements IComponent {
   private isFriendsActive: boolean = true;
  public render(): HTMLElement {
    const container = document.createElement("div");
    container.className = "profile-page";

    this.loadPageStyles();

    // Profile card
    const card = document.createElement("div");
    card.className = "profile-card";

    const avatar = document.createElement("div");
    avatar.className = "profile-avatar";

    const name = document.createElement("h2");
    name.className = "profile-name";
    name.textContent = "Hi Test!";

    const status = document.createElement("p");
    status.className = "profile-status online";
    status.innerHTML = "Online"; // Using innerHTML for the dot

    const settingsBtn = document.createElement("button");
    settingsBtn.className = "settings-btn";
    settingsBtn.innerHTML = "&#9881;"; // Gear icon using HTML entity

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
    } else {
      friendsList.appendChild(this.createRequest("RF", "Random Friend", "Pending"));
      friendsList.appendChild(this.createRequest("AF", "Another Friend", "Accepted"));
    }
    friends.appendChild(friendsList);
    friends.appendChild(friendsHeader);

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
    container.appendChild(card);
    container.appendChild(stats);
    container.appendChild(friends);
    container.appendChild(matchHistory);

    return container;
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

  const profileText = document.createElement("div");
  profileText.className = "friend-profile-text";

  const avatar = document.createElement("div");
  avatar.className = "friend-avatar";
  avatar.textContent = initials;

  const friendName = document.createElement("span");
  friendName.className = "friend-name";
  friendName.textContent = name;

  const status = document.createElement("span");
  status.className = `friend-status ${online ? "online" : "offline"}`;

  profileText.appendChild(avatar);
  profileText.appendChild(friendName);
  profileText.appendChild(status);
  inner.appendChild(profileText);
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

private createRequest(initials: string, name: string, status: string): HTMLElement {
    const item = document.createElement("div");
    item.className = "request-item";

    const avatar = document.createElement("div");
    avatar.className = "request-avatar";
    avatar.textContent = initials;

    const requestName = document.createElement("span");
    requestName.className = "request-name";
    requestName.textContent = name;

    const requestStatus = document.createElement("span");
    requestStatus.className = "request-status";
    requestStatus.textContent = status;

    item.appendChild(avatar);
    item.appendChild(requestName);
    item.appendChild(requestStatus);

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
}