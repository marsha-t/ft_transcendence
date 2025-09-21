export class Profile {
    render() {
        const container = document.createElement("div");
        container.className = "profile-page";
        this.loadPageStyles();
        const card = document.createElement("div");
        card.className = "profile-card";
        const avatar = document.createElement("div");
        avatar.className = "profile-avatar";
        avatar.textContent = "AV";
        const name = document.createElement("h2");
        name.className = "profile-name";
        name.textContent = "username";
        const status = document.createElement("p");
        status.className = "profile-status online";
        status.textContent = "● Online";
        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit Profile";
        card.appendChild(avatar);
        card.appendChild(name);
        card.appendChild(status);
        card.appendChild(editBtn);
        const stats = document.createElement("div");
        stats.className = "stats";
        const wins = this.createStat("??", "Wins", "stat-wins");
        const losses = this.createStat("??", "Losses", "stat-losses");
        const rank = this.createStat("??", "Rank", "stat-rank");
        stats.appendChild(wins);
        stats.appendChild(losses);
        stats.appendChild(rank);
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
        table.appendChild(tbody);
        matchHistory.appendChild(table);
        container.appendChild(card);
        container.appendChild(stats);
        container.appendChild(friends);
        container.appendChild(matchHistory);
        return container;
    }
    loadPageStyles() {
        if (document.getElementById("profile-styles"))
            return;
        const link = document.createElement("link");
        link.id = "profile-styles";
        link.rel = "stylesheet";
        link.href = "/styles/Profile.css";
        document.head.appendChild(link);
    }
    createStat(value, label, extraClass) {
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
    createFriend(initials, name, online) {
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
    createMatch(opponent, result, score, date) {
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
