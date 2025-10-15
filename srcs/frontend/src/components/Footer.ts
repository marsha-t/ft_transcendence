import { IComponent } from "./IComponent";

export class Footer implements IComponent {
  public render(): HTMLElement {
    const footer = document.createElement('footer');
    footer.className = `bg-color-yellow pt-3`;


    const subFooter = document.createElement('div');
    subFooter.className = `bg-background py-6 rounded-[16px]
        shadow-[0_-4px_4px_rgba(0,0,0,0.50)] flex items-end justify-between `;


    // === LEFT SIDE: BUTTON + STICK ===
    const leftImages = document.createElement('div');
    leftImages.className = 'flex items-end gap-3 ml-6';
    leftImages.appendChild(this.createImage('/assets/stick.png', 'Fight Stick'));
    leftImages.appendChild(this.createImage('/assets/button.png', 'Button'));

    // === CENTER: COPYRIGHT ===
    const content = document.createElement('p');
    content.className = 'text-color_white font-pixel text-[14px]';
    content.innerHTML = `© ${new Date().getFullYear()} Transcendence. All rights reserved.`;

    // === RIGHT SIDE: BUTTON + STICK ===
    const rightImages = document.createElement('div');
    rightImages.className = 'flex items-center gap-3 mr-6';
    rightImages.appendChild(this.createImage('/assets/button.png', 'Button'));
    rightImages.appendChild(this.createImage('/assets/stick.png', 'Fight Stick'));

    // Assemble footer
    subFooter.appendChild(leftImages);
    subFooter.appendChild(content);
    subFooter.appendChild(rightImages);
    footer.appendChild(subFooter);

    return footer;
  }

  // Helper method to create images
  private createImage(src: string, alt: string): HTMLImageElement {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = 'w-[50px] h-[50px] object-contain';
    return img;
  }
}
