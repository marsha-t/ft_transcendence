import { IComponent } from "../components/IComponent";

export class Profile implements IComponent {
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
    const stats = document.createElement("div");
    stats.className = "stats";
    // stats.textContent = "stat"

    // add vars to hold the numbers and tqake it from backend
    const wins = this.createStat("12", "Wins", "stat-wins"); // backend
    const losses = this.createStat("10", "Losses", "stat-losses"); // backend
    const rank = this.createStat("3", "Rank", "stat-rank"); // backend

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
    friendsTitle.textContent = "Friends";

    const addFriendBtn = document.createElement("button");
    addFriendBtn.className = "add-friend-btn";
    addFriendBtn.textContent = "Add Friend";

    friendsHeader.appendChild(friendsTitle);
    friendsHeader.appendChild(addFriendBtn);
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

    const avatar = document.createElement("div");
    avatar.className = "friend-avatar";
    avatar.textContent = initials;

    const friendName = document.createElement("span");
    friendName.className = "friend-name";
    friendName.textContent = name;

    const status = document.createElement("span");
    status.className = `friend-status ${online ? "online" : "offline"}`;
    status.textContent = "●";

    item.appendChild(avatar);
    item.appendChild(friendName);
    item.appendChild(status);

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
}
