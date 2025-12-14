import { IComponent } from "../components/IComponent";
import { AuthUtils } from "../utils/authUtils.js"; 
import { createButtonStyle } from "../utils";
import { makeCircular3DButton } from "../utils/uiUtils";

export class Main implements IComponent {
  public render(): HTMLElement {
    const container = document.createElement('div');
    container.className = `
      flex justify-center bg-background-secondary
      h-full py-[23px]`;

    const subContainer = document.createElement('div');
    subContainer.className = `
        flex flex-row items-center justify-start
        bg-background-primary rounded-[16px] shadow-lg
        mx-[23px] w-[calc(100%-46px)]
        h-auto py-6 px-10`;
    
    // Left side (title + description)
    const textSection = document.createElement('div');
    textSection.className = `
      flex-1 basis-[400px] max-w-[600px]
      text-white`;

    const heading = document.createElement('h1');
    heading.className = `
      text-[clamp(18px,4vw,28px)] font-nunito mb-4
      text-[16px] tracking-widest`;
    heading.textContent = "About the game";
    textSection.appendChild(heading);

    const description = document.createElement('p');
    description.className = `
      text-[clamp(8px,1.2vw,10px)] leading-[1.5]
      font-sans text-[10px] leading-[3] tracking-wider`;
    description.textContent = `Experience the classic Pong game with a modern twist! Challenge friends or compete in thrilling matches. 
                                Transcendence Pong offers fast-paced gameplay, sleek design, and exciting multiplayer features. 
                                Sign up or log in to join the fun and test your skills in this timeless arcade classic! Experience the classic Pong game with a modern twist! Challenge friends or compete in thrilling matches. 
                                Pong offers fast-paced gameplay, sleek design, and exciting multiplayer features. 
                                Sign up or log in to join the fun and test your skills in this timeless arcade classic!`;
    textSection.appendChild(description);

    // Right side (buttons)
    const rightSection = document.createElement('div')
    rightSection.className = `
      flex flex-col justify-center items-center flex-1 gap-4`;

      
      if (AuthUtils.isLoggedIn()) {
        const challengeHeading = document.createElement('h2');
        challengeHeading.className = `
          text-white text-[36px] font-pixel mb-6
          tracking-wider text-center`;
        challengeHeading.textContent = "Select a Challenge";
        rightSection.appendChild(challengeHeading);
    
        const tournamentBtn = makeCircular3DButton("Tournament", "tournament-btn", "/tournament", "🏆");
        const aiButton = makeCircular3DButton("Play AI", "ai-btn", "/ai", "🤖");
        const playButton = makeCircular3DButton("VS Friend", "play-btn", "/game", "👥");
      

        const buttonGrid = document.createElement('div');
        buttonGrid.className = "flex flex-col gap-0 items-center relative";
        tournamentBtn.className += " transform translate-x-28";
        aiButton.className += " transform -translate-x-28";
        playButton.className += " transform translate-x-28";

        buttonGrid.appendChild(tournamentBtn);
        buttonGrid.appendChild(aiButton);
        buttonGrid.appendChild(playButton);
        
        rightSection.appendChild(buttonGrid);
    } else { 
      // GIF placeholder
      const gif = document.createElement('img');
      gif.src = "./pong_game.gif"; // path to your GIF
      // gif.alt = "Bouncing Pong Ball";
      gif.className = "w-[600px] h-[350px]"; // Tailwind classes for size & simple animation
      rightSection.appendChild(gif);

      const preloginButton = document.createElement('button');
      preloginButton.textContent = "Log in to unlock challenges!";
      preloginButton.className = createButtonStyle("animate-bounce", 'green');
      preloginButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/login";
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
