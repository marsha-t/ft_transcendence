import { SUPPORTED_LANGUAGES, getCurrentLanguage, changeLanguage, t } from '../services/i18n/i18nService.js';

export class LanguageSwitcher {
  private container: HTMLElement;
  private currentLang: string;

  constructor() {
    this.container = document.createElement('div');
    this.currentLang = getCurrentLanguage();
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.className = 'language-switcher relative inline-block';
    
    const currentLangInfo = SUPPORTED_LANGUAGES[this.currentLang as keyof typeof SUPPORTED_LANGUAGES];
    
    this.container.innerHTML = `
      <button 
        class="lang-button flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600"
        aria-label="${t('settings.selectLanguage')}"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
        </svg>
        <span class="font-medium">${currentLangInfo.nativeName}</span>
        <svg class="w-4 h-4 transition-transform dropdown-arrow" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
      
      <div class="lang-dropdown hidden absolute ${this.currentLang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-50">
        ${Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => `
          <button 
            class="lang-option w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center justify-between ${code === this.currentLang ? 'bg-gray-700' : ''}"
            data-lang="${code}"
          >
            <span class="font-medium">${info.nativeName}</span>
            ${code === this.currentLang ? `
              <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            ` : ''}
          </button>
        `).join('')}
      </div>
    `;
  }

  private attachEventListeners(): void {
    const button = this.container.querySelector('.lang-button') as HTMLButtonElement;
    const dropdown = this.container.querySelector('.lang-dropdown') as HTMLElement;
    const arrow = this.container.querySelector('.dropdown-arrow') as HTMLElement;

    // Toggle dropdown
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = dropdown.classList.contains('hidden');
      dropdown.classList.toggle('hidden', !isHidden);
      arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.add('hidden');
      arrow.style.transform = 'rotate(0deg)';
    });

    // Language selection
    const options = this.container.querySelectorAll('.lang-option');
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = (e.currentTarget as HTMLElement).dataset.lang!;
        this.changeLanguage(selectedLang);
        dropdown.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
      });
    });
  }

  private changeLanguage(lang: string): void {
    changeLanguage(lang);
    this.currentLang = lang;
    this.render();
    this.attachEventListeners();
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}