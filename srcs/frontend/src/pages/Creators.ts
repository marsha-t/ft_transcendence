import { IComponent } from "../components/IComponent";

export class Creators implements IComponent {
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
            
        //left half
        const text_section = document.createElement('div');
        text_section.className = `flex-1 basis-[400px] max-w-[600px]
            text-color_white font-press `;

        const heading = document.createElement('h1');
        heading.className = `text-[clamp(18px,4vw,28px)]
            mb-4 tracking-widest`;
        heading.textContent = "Creators";
        text_section.appendChild(heading);

        const description = document.createElement('p');
        description.className = `text-[clamp(8px,1.2vw,10px)] 
            leading-[1.5]font-press text-[10px] 
            leading-[3] tracking-wider`;
        description.textContent = `Contrary to popular belief, Lorem Ipsum is not simply 
                                    random text. It has roots in a piece of classical Latin 
                                    literature from 45 BC, making it over 2000 years old. Richard 
                                    McClintock, a Latin professor at Hampden-Sydney College in Virginia, 
                                    looked up one of the more obscure Latin words, consectetur, from a 
                                    Lorem Ipsum passage, and going through the cites of the word in classical
                                     literature, discovered the undoubtable source. Contrary to popular 
                                     belief, Lorem Ipsum is not simply random text. It has roots in a piece 
                                     of classical Latin literature from 45 BC, making it over 2000 years old.
                                      Richard McClintock, a Latin professor at Hampden-Sydney College in
                                       Virginia, looked up one of the more obscure Latin words, consectetur,
                                        from a Lorem Ipsum passage, and going through the cites of the word 
                                        in classical literature, discovered the undoubtable source. `

        text_section.appendChild(description);

        // Update the image_section
        const image_section = document.createElement('div');
        image_section.className = `flex-1 flex justify-center 
            font-press text-color_white ml-20`;

        const avatarsGrid = document.createElement('div');
        avatarsGrid.className = `grid grid-cols-2 gap-[40px] mt-[20px]`;

        // First avatar
        const firtsAvatar = document.createElement("div");
        firtsAvatar.className = `flex flex-col items-start 
            p-4 border-2 border-red-500 rounded-[10px]
            w-[180px] h-[200px]`;

        const avatar_marsha = document.createElement('img');
        avatar_marsha.src = "/avatar/marsha.png";
        avatar_marsha.alt = "avatar marsha";
        avatar_marsha.className = `w-[120px] h-[120px] rounded-full object-cover mb-2 self-center`;

        const marsha = document.createElement('p');
        marsha.className = "text-[8px] font-bold text-left w-full mb-1 mt-2";
        marsha.textContent = "Marsha Teo";

        const role_marsha = document.createElement('p');
        role_marsha.className = `text-[8px] text-left w-full`;
        role_marsha.textContent = "Backend developer";

        firtsAvatar.appendChild(avatar_marsha);
        firtsAvatar.appendChild(marsha);
        firtsAvatar.appendChild(role_marsha);

        // Second avatar
        const secondAvatar = document.createElement("div");
        secondAvatar.className =  `flex flex-col items-start 
            p-4 border-2 border-red-500 rounded-[10px]
            w-[180px] h-[200px]`;

        const avatar_sabira = document.createElement('img');
        avatar_sabira.src = "/avatar/sabira.png";
        avatar_sabira.alt = "avatar sabira";
        avatar_sabira.className = `w-[120px] h-[120px] rounded-full object-cover mb-2 self-center`;

        const sabira = document.createElement('p');
        sabira.className = `text-[8px] font-bold text-center w-full break-words mb-1 mt-2`;
        sabira.textContent = "Makhamatkaiym kyzy Sabira";

        const role_sabira = document.createElement('p');
        role_sabira.className = `text-[8px] text-left w-full`;
        role_sabira.textContent = "Frontend developer";

        secondAvatar.appendChild(avatar_sabira);
        secondAvatar.appendChild(sabira);
        secondAvatar.appendChild(role_sabira);

        // Third avatar
        const thirdAvatar = document.createElement("div");
        thirdAvatar.className = `flex flex-col items-start 
            p-4 border-2 border-red-500 rounded-[10px]
            w-[180px] h-[200px]`;

        const avatar_dina = document.createElement('img');
        avatar_dina.src = "/avatar/dina.png";
        avatar_dina.alt = "avatar dina";
        avatar_dina.className = `w-[120px] h-[120px] rounded-full object-cover mb-2 self-center`;

        const dina = document.createElement('p');
        dina.className = `text-[8px] font-bold text-left w-full mb-1 mt-2`;
        dina.textContent = "Dina";

        const role_dina = document.createElement('p');
        role_dina.className = `text-[8px] text-left w-full `;
        role_dina.textContent = "Backend developer";

        thirdAvatar.appendChild(avatar_dina);
        thirdAvatar.appendChild(dina);
        thirdAvatar.appendChild(role_dina);

        // Fourth avatar
        const fourthAvatar = document.createElement("div");
        fourthAvatar.className =  `flex flex-col items-start 
            p-4 border-2 border-red-500 rounded-[10px]
            w-[180px] h-[200px]`;

        const avatar_rawan = document.createElement('img');
        avatar_rawan.src = "/avatar/rawan.png";
        avatar_rawan.alt = "avatar rawan";
        avatar_rawan.className = `w-[120px] h-[120px] rounded-full object-cover mb-2 self-center`;

        const rawan = document.createElement('p');
        rawan.className = `text-[8px] font-bold text-left w-full mb-1 mt-2`;
        rawan.textContent = "Rawan";

        const role_rawan = document.createElement('p');
        role_rawan.className = `text-[8px] text-left w-full`;
        role_rawan.textContent = "Backend developer";

        fourthAvatar.appendChild(avatar_rawan);
        fourthAvatar.appendChild(rawan);
        fourthAvatar.appendChild(role_rawan);


        avatarsGrid.appendChild(firtsAvatar);
        avatarsGrid.appendChild(secondAvatar);
        avatarsGrid.appendChild(thirdAvatar);
        avatarsGrid.appendChild(fourthAvatar);

        image_section.appendChild(avatarsGrid);

        subContainer.appendChild(text_section);
        subContainer.appendChild(image_section);

        //Add to the main container
        container.appendChild(subContainer);
        return container;
    }

}
