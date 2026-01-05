import { IComponent } from "../components/IComponent";
import { apiServices } from '../services/ApiServices.js';
import { MatchHistory as MatchHistoryType } from '../services/dashboard/types'; 
import { getAvatarUrl } from "../utils/profileUtils.js";
import { createButtonStyle } from "../utils";
import { t } from "../services/i18n/i18nService.js";

/**
 * MatchHistory Component
 * ----------------------
 * Displays a table showing the user's recent matches,
 * including opponent, result, score, and date.
 */

export class MatchHistory implements IComponent {
  private container!: HTMLElement;
  private matchHistoryData: MatchHistoryType[] = [];
  private dashboardBtnEl: HTMLElement | null = null;
  private dashboardBtnHandler: (() => void) | null = null;

  constructor() {
  }

  // Renders the MatchHistory component
  render(): HTMLElement {
    const matchHistory = document.createElement("div");
    matchHistory.className = `match-history-table rounded-2xl bg-[#21447E] opacity-100 p-4 text-white min-h-0 overflow-y-auto`;
    this.container = matchHistory;

    const matchTitle = document.createElement("h3");
    matchTitle.className = " h-[30px] text-[24px] font-pixel font-[400] text-color_white mb-[10px]";
    matchTitle.textContent = t("match-history.title") as string;
    matchHistory.appendChild(matchTitle);

    const table = document.createElement("table");
    table.className = "w-full border-collapse rounded-[20px] overflow-hidden font-pixel";
    table.style.borderSpacing = "0";
    const thead = document.createElement("thead");
    thead.className = "w-[1014px] h-[47px] font-pixel font-[400] text-color_white";
    const headerRow = document.createElement("tr");
    headerRow.className = ` w-full
        p-2 font-pixel font-[400]
        text-color_white
        gap-[50px] 
        text-[16px] font-semibold text-color_white bg-none
        mb-[10px] border-b border-gray-500 rounded-l-lg`;

    const columns = [t("match-history.opponent") as string, t("match-history.result") as string, t("match-history.score") as string, t("match-history.date") as string];
    columns.forEach((col) => {
      const th = document.createElement("th");
      th.className = "text-center text-[16px] leading-[18px] uppercase text-left px-4 py-3 font-pixel font-[400] text-color_white";
      th.textContent = col;
      headerRow.appendChild(th);
    });
  
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    tbody.id = "match-history-body";
    
    table.appendChild(tbody);
    matchHistory.appendChild(table);
    
    this.fetchData().then(() => {
      this.updateMatchHistory();
    });

    return matchHistory;
  }

  // Fetches match history data from backend
  public async fetchData(): Promise<void> {
    try {
      const matchHistoryResponse = await apiServices.dashboard.getMatchHistory();
      if (matchHistoryResponse.success && matchHistoryResponse.data) {
        this.matchHistoryData = matchHistoryResponse.data;
      }
    } catch (error) {
      console.error("Error fetching match history:", error);
    }
  }

  // Creates a table row for a single match
  private createMatch(opponent: string, opponentAvatar: string, result: "WIN" | "LOSS", score: string, date: string, index: number): HTMLElement {
    const localizedResult = result === "WIN" ? t("match-history.win") : t("match-history.loss");
    const row = document.createElement("tr");
    row.className = `w-[full] h-[65px] justify-between  text-center px-4 py-3 m-3
    ${index % 2 === 0 ? "bg-[#7EA2DD]" : "bg-[none]"} `;
    row.style.overflow = "hidden";  

    const opponentCell = document.createElement("td");
    opponentCell.style.borderTopLeftRadius = "20px";
    opponentCell.style.borderBottomLeftRadius = "20px";
    const opponentWrapper = document.createElement("div");
    opponentWrapper.className = "flex items-center justify-center gap-3";

    const avatarImg = document.createElement("img");
    avatarImg.src = getAvatarUrl(opponentAvatar);
    avatarImg.alt = `${opponent}'s avatar`;
    avatarImg.className = "w-8 h-8 rounded-full object-cover border border-gray-600";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = opponent;

    opponentWrapper.appendChild(avatarImg);
    opponentWrapper.appendChild(nameSpan);
    opponentCell.appendChild(opponentWrapper);

    const resultCell = document.createElement("td");
    resultCell.textContent = localizedResult;
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

  // Updates the match history table with fetched data
  private updateMatchHistory(): void {
    const tableBody = this.container?.querySelector<HTMLTableSectionElement>("#match-history-body");
    if (!tableBody) {
      console.warn("updateMatchHistory: tbody not found (#match-history-body)");
      return;
    }
    tableBody.innerHTML = "";
    if (!this.matchHistoryData || this.matchHistoryData.length === 0) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 4;
      emptyCell.textContent = t("match-history.noMatches") as string;
      emptyCell.className = "text-gray-400 text-center py-3";
      emptyRow.appendChild(emptyCell);
      tableBody.appendChild(emptyRow);
      return;
    }

    this.matchHistoryData.forEach((match, index) => { 
      const formattedDate = new Date(match.date).toLocaleDateString();
      const score = `${match.userScore} - ${match.opponentScore}`;
      const row = this.createMatch(match.opponent, match.opponentAvatar, match.result, score, formattedDate, index);
      tableBody.appendChild(row);
    });
  }
}

/**
 * HeatMap Component
 * ----------------
 * Displays a calendar-style heatmap showing play frequency
 * for the last N months.
 */

export class HeatMap implements IComponent {
  private container!: HTMLElement;
  private dashboardBtnEl: HTMLElement | null = null;
  private dashboardBtnHandler: (() => void) | null = null;

  constructor() {
  }

  render(): HTMLElement {
    const heatmap = document.createElement('div');
    heatmap.className = `rounded-2xl bg-[#21447E] opacity-100 p-4 text-white min-h-0 overflow-hidden`;
    this.container = heatmap;
    
    // Render last 4 months by default
    void this.createHeatmap(heatmap, 4);

    return heatmap;
  }

  // Refreshes the heatmap data and UI 
  public async refreshHeatmap(): Promise<void> {
    if (this.container) {
      await this.createHeatmap(this.container, 4);
    }
  }

  // service method to build the heatmap UI
  private async createHeatmap(container: HTMLElement, monthsToShow: number = 4): Promise<void> {
    container.innerHTML = "";
    container.className = `rounded-2xl bg-[#21447E] opacity-100 p-4 text-white flex flex-col justify-between `;

    // Grid container
    const monthsGrid = document.createElement("div");
    monthsGrid.className = "grid grid-cols-4 gap-4";
    container.appendChild(monthsGrid);

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    // Compute date range: last `monthsToShow` months ending this month
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - (monthsToShow - 1), 1);

    // Fetch play counts for the visible range
    const startISO = startDate.toISOString().slice(0,10);
    const endISO = endDate.toISOString().slice(0,10);
    let dayCounts: Record<string, number> = {};
    try {
      // ✅ CHANGED: Use dashboard service instead of profile service
      const res = await apiServices.dashboard.getPlayCounts(startISO, endISO);
      if (res.success && res.data) {
        res.data.forEach((item: {date: string, count: number}) => { 
          dayCounts[item.date] = item.count; 
        });
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
          if (c <= 0) return "bg-[#183B76]";
          if (c === 1) return "bg-[#1F4D9A]";
          if (c === 2) return "bg-[#99B5E5]";
          return "bg-white";
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
    button.textContent = t("profile.dashboardBtn") as string;
    button.className = createButtonStyle("absolute bottom-4 right-4 w-fit h-[32px] whitespace-nowrap font-pixel", 'green');
    // store handler for cleanup
    this.dashboardBtnHandler = () => {
      history.pushState(null, '', '/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
    button.addEventListener("click", this.dashboardBtnHandler);
    this.dashboardBtnEl = button;
    container.style.position = "relative";
    container.appendChild(button);
  }

  // Remove any listeners and DOM refs when the page is torn down
  public cleanup(): void {
    try {
      if (this.dashboardBtnEl && this.dashboardBtnHandler) {
        this.dashboardBtnEl.removeEventListener('click', this.dashboardBtnHandler as EventListener);
      }
    } catch (err) {
      console.warn('Error removing MatchHistory listeners:', err);
    }
    this.dashboardBtnEl = null;
    this.dashboardBtnHandler = null;
    this.container = null as any;
  }
}
