import { IComponent } from "../components/IComponent";
import { AuthUtils } from "../utils/authUtils.js"; 
import { createButtonStyle, makeCircular3DButton } from "../utils/uiUtils";
import { t } from "../services/i18n/i18nService.js";
import {navigate} from '../utils/commonUtils.js';


export class Main implements IComponent {

  public render(): HTMLElement {
    const container = document.createElement('div');
    container.className = `flex justify-center bg-background-secondary
      h-full py-[23px]`;

    const subContainer = document.createElement('div');
    subContainer.className = `flex flex-row items-start justify-center
        bg-background-primary rounded-[16px] shadow-lg
        mx-[23px] w-[calc(100%-46px)] h-auto py-6 px-10`;
    
    // Left side (title + description)
    const textSection = document.createElement('div');
    textSection.className = `
      flex-1 basis-[400px] max-w-[600px] text-white pt-16`;

    const heading = document.createElement('h1');
    heading.className = `text-[clamp(18px,4vw,36px)] font-nunito mb-4 tracking-widest`;
      heading.textContent = t("main.discriptionHeader") as string;
    textSection.appendChild(heading);

    const description = document.createElement('p');
    description.className = `text-[clamp(8px,1.2vw,20px)] leading-[2] font-sans tracking-wider`;
    description.textContent = t("main.discription") as string;
    textSection.appendChild(description);

    // Right side (buttons)
    const rightSection = document.createElement('div')
    rightSection.className = `flex flex-col items-center flex-1 pt-16`;

      if (AuthUtils.isLoggedIn()) {
        const challengeHeading = document.createElement('h2');
        challengeHeading.className = `text-white text-[36px] font-pixel mb-4
          tracking-wider text-center`;
        challengeHeading.textContent = t("main.challengeHeader") as string;
        rightSection.appendChild(challengeHeading);
    
        const tournamentBtn = makeCircular3DButton(t("main.play-tournament") as string, "tournament-btn", "/tournament", "🏆");
        const aiButton = makeCircular3DButton(t("main.play-AI") as string, "ai-btn", "/ai", "🤖");
        const playButton = makeCircular3DButton(t("main.play-friend") as string, "play-btn", "/game", "👥");
      
        tournamentBtn.addEventListener("click", (e) => {
          e.preventDefault();
          navigate("/tournament");
        });

        aiButton.addEventListener("click", (e) => {
          e.preventDefault();
          navigate("/ai");
        });
        playButton.addEventListener("click", (e) => {
          e.preventDefault();
          navigate("/game");
        });

        const buttonGrid = document.createElement('div');
        buttonGrid.className = "flex flex-col items-center relative -space-y-4";
        tournamentBtn.className += " transform translate-x-28 m-0";
        aiButton.className += " transform -translate-x-28 m-0";
        playButton.className += " transform translate-x-28 m-0";

        buttonGrid.appendChild(tournamentBtn);
        buttonGrid.appendChild(aiButton);
        buttonGrid.appendChild(playButton);
        
        rightSection.appendChild(buttonGrid);
    } else { 
      // GIF placeholder
      const gif = document.createElement('img');
      gif.src = "./pong_game.gif";
      gif.className = "w-[600px] h-[350px] mb-6";
      rightSection.appendChild(gif);

      const preloginButton = document.createElement('button');
      preloginButton.type = 'button';
      preloginButton.textContent = t("main.loginToUnlock") as string;
      preloginButton.className = createButtonStyle("animate-bounce", 'green');
      
      preloginButton.addEventListener("click", (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        navigate("/login");
      })

      rightSection.appendChild(preloginButton);
    }

    // Add to subcontainer
    subContainer.appendChild(textSection);
    subContainer.appendChild(rightSection);

    //add to the main container
    container.appendChild(subContainer);

    return container;
  } 
}
