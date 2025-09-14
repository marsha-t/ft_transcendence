import { IComponent } from "../components/IComponent";

export class Creators implements IComponent {
    public render(): HTMLElement {
        const container = document.createElement('div');
        container.className = "creators_page";

        //left half
        const text_section = document.createElement('div');
        text_section.className = "text_section";

        const heading = document.createElement('h1');
        heading.className = "main_title";
        heading.textContent = "Creators";
        text_section.appendChild(heading);

        const description = document.createElement('p');
        description.className = "description";
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

        //avatar_section
        const image_section = document.createElement('div');
        image_section.className = "image_section"

        const avatarsGrid = document.createElement('div');
        avatarsGrid.className = "avatars_grid"

        //firts avatar
        const firtsAvatar = document.createElement("div");
        firtsAvatar.className = "avatar_card";

        const avatar_marsha = document.createElement('img');
        avatar_marsha.src = "/assets/avatar/marsha.png";
        avatar_marsha.alt = "avatar marsha";
        avatar_marsha.className = 'avatar_img';

        const marsha = document.createElement('a');
        marsha.className = "avatar_name";
        marsha.textContent = "Marsha Teo";

        const role_marsha = document.createElement('a');
        role_marsha.className = "avatar_role";
        role_marsha.textContent = "Backend developer";

        firtsAvatar.appendChild(avatar_marsha);
        firtsAvatar.appendChild(marsha);
        firtsAvatar.appendChild(role_marsha);
        
        //second avatar
        const secondAvatar = document.createElement("div");
        secondAvatar.className = "avatar_card";

        const avatar_sabira = document.createElement('img');
        avatar_sabira.src = "/assets/avatar/sabira.png";
        avatar_sabira.alt = "avatar sabira";
        avatar_sabira.className = 'avatar_img';

        const sabira = document.createElement('a');
        sabira.className = "avatar_name";
        sabira.textContent = "Sabira Makhamatkaiym kyzy";

        const role_sabira = document.createElement('a');
        role_sabira.className = "avatar_role";
        role_sabira.textContent = "Frontend developer";

        secondAvatar.appendChild(avatar_sabira);
        secondAvatar.appendChild(sabira);
        secondAvatar.appendChild(role_sabira);

        //third avatar
        const thirdAvatar = document.createElement("div");
        thirdAvatar.className = "avatar_card";

        const avatar_dina = document.createElement('img');
        avatar_dina.src = "/assets/avatar/dina.png";
        avatar_dina.alt = "avatar sabira";
        avatar_dina.className = 'avatar_img';

        const dina = document.createElement('a');
        dina.className = "avatar_name";
        dina.textContent = "Dina";

        const role_dina = document.createElement('a');
        role_dina.className = "avatar_role";
        role_dina.textContent = "Backend developer";

        thirdAvatar.appendChild(avatar_dina);
        thirdAvatar.appendChild(dina);
        thirdAvatar.appendChild(role_dina);
        
        //fourth avatar
        const fourthAvatar = document.createElement("div");
        fourthAvatar.className = "avatar_card";

        const avatar_rawan = document.createElement('img');
        avatar_rawan.src = "/assets/avatar/rawan.png";
        avatar_rawan.alt = "avatar sabira";
        avatar_rawan.className = 'avatar_img';

        const rawan = document.createElement('a');
        rawan.className = "avatar_name";
        rawan.textContent = "Rawan";

        const role_rawan = document.createElement('a');
        role_rawan.className = "avatar_role";
        role_rawan.textContent = "Backend developer";

        fourthAvatar.appendChild(avatar_rawan);
        fourthAvatar.appendChild(rawan);
        fourthAvatar.appendChild(role_rawan);


        avatarsGrid.appendChild(firtsAvatar);
        avatarsGrid.appendChild(secondAvatar);
        avatarsGrid.appendChild(thirdAvatar);
        avatarsGrid.appendChild(fourthAvatar);

        image_section.appendChild(avatarsGrid);

        container.appendChild(text_section);
        container.appendChild(image_section);
        return container;
    }
}
