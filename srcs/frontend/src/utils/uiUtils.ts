export function makeButton(label: string, id: string, display: string, handler: () => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.id = id;

    btn.className =
      "w-48 h-12 bg-color-green text-color_white font-bold rounded-lg " +
      "shadow-[0_5px_0_var(--color-button-second)] " +
      "hover:shadow-[0_2px_0_var(--color-button-second)] active:shadow-none " +
      "hover:translate-y-1 active:translate-y-2 " +
      "transition-all duration-150 mt-5";
    btn.style.display = display;
    btn.textContent = label;
    btn.addEventListener("click", handler);

    return btn;
  }


  //<div class='button w-16 h-16 bg-blue-500 rounded-full cursor-pointer select-none
  //   active:translate-y-2  active:[box-shadow:0_0px_0_0_#1b6ff8,0_0px_0_0_#1b70f841]
  //   active:border-b-[0px]
  //   transition-all duration-150 [box-shadow:0_8px_0_0_#1b6ff8,0_13px_0_0_#1b70f841]
  //   border-[1px] border-blue-400
  // '>