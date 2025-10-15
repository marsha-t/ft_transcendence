import { IComponent } from "../components/IComponent";

export class Main implements IComponent {
  public render(): HTMLElement {
    const container = document.createElement('div');
    container.className = `
      flex justify-center
      flex-wrap min-h-[85vh] pt-3 pb-[23px]
      bg-color-yellow`;

    // === SUBcontainer ===
    const subContainer = document.createElement('div');
    subContainer.className = `
        flex flex-row  items-center justify-between  
        flex-wrap  bg-background rounded-[16px]
        shadow-lg mx-[23px] w-[calc(100%-46px)]
        h-auto p-10 gap-8`;
    
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

    // Right side (button)
    const rightSection = document.createElement('div')
    rightSection.className = `
      flex justify-center flex-1`;

    const playButton = document.createElement('a');
    playButton.href = "/game";
    playButton.className = `
      flex justify-center items-center 
      w-[260px] h-[82px] px-[46px] rounded-[10px] 
      text-white text-[44px] font-pixel cursor-pointer 
      bg-color_button hover:bg-color-secondary 
      transition-colors duration-300 
      border-color_border no-underline gap-2`;
    // playButton.textContent = "PLAY NOW";
    playButton.textContent = "START";

    // const arrow = document.createElement('img');
    // arrow.src = "/assets/arrow.png"; // Path to arrow.png in public/assets/
    // arrow.alt = "Arrow icon";
    // arrow.className =  `w-[30px] h-[30px]`;

    // playButton.appendChild(arrow);
    rightSection.appendChild(playButton);

    // Add to subcontainer
    subContainer.appendChild(textSection);
    subContainer.appendChild(rightSection);

    //add to the main container
    container.appendChild(subContainer);

    return container;
  }

}
