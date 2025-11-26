import { IComponent } from "../components/IComponent";

export class Main implements IComponent {
  public render(): HTMLElement {
    const container = document.createElement('div');
    container.className = `
      flex justify-center bg-color-yellow
      h-full py-[23px]`;

    const subContainer = document.createElement('div');
    subContainer.className = `
        flex flex-row items-center justify-start
        bg-background rounded-[16px] shadow-lg
        mx-[23px] w-[calc(100%-46px)]
        h-auto py-6 px-10`;
    
    // Left side (title + description)
    const textSection = document.createElement('div');
    textSection.className = `
      flex-1 basis-[400px] max-w-[600px]
      text-color_white`;

    const heading = document.createElement('h1');
    heading.className = `
      text-[clamp(18px,4vw,28px)] font-press mb-4
      text-[16px] tracking-widest`;
    heading.textContent = "About the game";
    textSection.appendChild(heading);

    const description = document.createElement('p');
    description.className = `
      text-[clamp(8px,1.2vw,10px)] leading-[1.5]
      font-press text-[10px] leading-[3] tracking-wider`;
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

    const challengeHeading = document.createElement('h2');
    challengeHeading.className = `
      text-white text-[36px] font-pixel mb-6
      tracking-wider text-center`;
    challengeHeading.textContent = "Select a Challenge";
    rightSection.appendChild(challengeHeading);

    const tournamentBtn = document.createElement('a');
    tournamentBtn.href = "/tournament";
    tournamentBtn.className =
      "inline-flex items-center justify-center px-8 py-3 bg-color-green text-color_white " +
      "font-bold rounded-lg tracking-widest " + 
      "shadow-[0_5px_0_var(--color-button-second)] " +
      "hover:shadow-[0_2px_0_var(--color-button-second)] active:shadow-none " +
      "hover:translate-y-1 active:translate-y-2 " +
      "transition-all duration-150 mt-5 text-center no-underline";
    tournamentBtn.textContent = "TOURNAMENT";

    const aiButton = document.createElement('a');
    aiButton.href = "/ai"; // add link when AI game is implemented
    aiButton.className =
      "inline-flex items-center justify-center px-8 py-3 bg-color-green text-color_white " +
      "font-bold rounded-lg tracking-widest " +
      "shadow-[0_5px_0_var(--color-button-second)] " +
      "hover:shadow-[0_2px_0_var(--color-button-second)] active:shadow-none " +
      "hover:translate-y-1 active:translate-y-2 " +
      "transition-all duration-150 mt-5 text-center no-underline";
    aiButton.textContent = "PLAY WITH AI";
  
    const playButton = document.createElement('a');
    playButton.href = "/game";
    // playButton.className =
    //   "inline-flex items-center justify-center px-8 py-3 bg-color-green text-color_white font-bold rounded-lg " +
    //   "shadow-[0_5px_0_var(--color-button-second)] hover:shadow-[0_2px_0_var(--color-button-second)] active:shadow-none " +
    //   "hover:translate-y-1 active:translate-y-2 transition-all duration-150 mt-5 text-center no-underline";

    playButton.className =
      "inline-flex items-center justify-center px-8 py-3 bg-color-green text-color_white " +
      "font-bold rounded-lg tracking-widest " + 
      "shadow-[0_5px_0_var(--color-button-second)] " +
      "hover:shadow-[0_2px_0_var(--color-button-second)] active:shadow-none " +
      "hover:translate-y-1 active:translate-y-2 " +
      "transition-all duration-150 mt-5 text-center no-underline";

    playButton.textContent = "PLAY WITH FRIEND";

    rightSection.appendChild(tournamentBtn);
    rightSection.appendChild(aiButton);
    rightSection.appendChild(playButton);

    // Add to subcontainer
    subContainer.appendChild(textSection);
    subContainer.appendChild(rightSection);

    //add to the main container
    container.appendChild(subContainer);

    return container;
  }

}
