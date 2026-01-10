import { gameConfigManager } from '../graphics/GameConfigManager';
import { CustomGameSettings, GamePreset } from "../graphics/types";

import { GameConfig } from '../graphics/GameConfig';
import { makeButton } from './uiUtils';
import { t } from "../services/i18n/i18nService";

export interface CustomizationUIConfig {
    applyUserSettings: (settings: CustomGameSettings) => void;
    onCancel?: () => void;
    container: HTMLElement;
    showAdvanced?: boolean;
}

/**
 * GameCustomizationUI
 * 
 * PURPOSE:
 * - Provides DOM-based UI for game customization
 * - Supports preset selection (Classic, Fast, Chaos, Custom)
 * - Allows fine-tuning of game parameters
 * - Consistent interface across AI, P2P, and Tournament modes
 */
export class GameCustomizationUI {
    private container: HTMLElement;
    private overlay: HTMLDivElement | null = null;
    private modal: HTMLDivElement | null = null;
    private applyUserSettings: (settings: CustomGameSettings) => void;
    private onCancel?: () => void;
    private showAdvanced: boolean;
    private currentPreset: GamePreset = 'CLASSIC';
    private customSettings: any = {};
    private eventListeners: Array<{
        element: HTMLElement | Window;
        event: string;
        handler: EventListener;
    }> = [];

    constructor(config: CustomizationUIConfig) {
        this.container = config.container;
        this.applyUserSettings = config.applyUserSettings;
        this.onCancel = config.onCancel;
        this.showAdvanced = config.showAdvanced ?? true;
    }

    // Helper to track event listeners
    private addMyEventListener(
        element: HTMLElement | Window,
        event: string,
        handler: EventListener
    ): void {
        element.addEventListener(event, handler);
        this.eventListeners.push({element, event, handler});
    }

    //Opens the customization modal
    public open(): void {
        this.createModal();
        this.updatePreview();
    }

    //Closes and cleans up the modal
    public close(): void {
      // Remove all tracked event listeners
        this.eventListeners.forEach(({element, event, handler}) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            this.modal = null;
        }
        this.customSettings = {};
    }

    // Creates the main modal structure
    private createModal(): void {
        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.className =   `fixed top-0 left-0 w-full h-full bg-modal-background/20 
         flex items-center justify-center z-[1000] backdrop-blur-sm`;

        // Modal
        this.modal = document.createElement('div');
        this.modal.className = `
            rounded-2xl p-8 max-w-[800px] w-[90%] max-h-[90vh] overflow-y-auto
            shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10
            bg-[var(--color-modal-background)]`;

        // Header
        const header = this.createHeader();
        this.modal.appendChild(header);

        // Preset Selection
        const presetSection = this.createPresetSection();
        this.modal.appendChild(presetSection);

        // Advanced Settings (if enabled)
        if (this.showAdvanced) {
            const advancedSection = this.createAdvancedSection();
            this.modal.appendChild(advancedSection);
        }

        // Preview Section
        const previewSection = this.createPreviewSection();
        this.modal.appendChild(previewSection);

        // Action Buttons
        const actions = this.createActionButtons();
        this.modal.appendChild(actions);

        this.overlay.appendChild(this.modal);
        this.container.appendChild(this.overlay);

        // Close on overlay click- using tracked addEventListener
        const overlayClickHandler = (e: Event) => {
            if (e.target === this.overlay) {
                this.handleCancel();
            }
        };
        this.addMyEventListener(this.overlay, 'click', overlayClickHandler);
    }

    //Creates the modal header
    private createHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = `mb-6 border-b-2 border-white/10 pb-4 `;

        const title = document.createElement('h2');
        title.textContent = t("gameCustomization.title") as string;
        title.className = 'm-0 text-white text-2xl font-bold font-nonito';

        const subtitle = document.createElement('p');
        subtitle.textContent = t("gameCustomization.discription") as string;
        subtitle.className = 'mt-2 text-white/60 text-sm text-nunito';

        header.appendChild(title);
        header.appendChild(subtitle);
        return header;
    }

    //Creates the preset selection section
    private createPresetSection(): HTMLElement {
        const section = document.createElement('div');
        section.className = `mb-4`;

        const label = document.createElement('h3');
        label.textContent = t("gameCustomization.gameModePresets") as string;
        label.className = 'text-white text-lg font-semibold mb-4';

        const presetGrid = document.createElement('div');
        presetGrid.className = `grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]`;

        const presets: Array<{
            value: GamePreset;
            label: string;
            icon: string;
            description: string;}> = [
            { value: 'CLASSIC', label: t("gameCustomization.classic") as string, icon: '🏓', description: t("gameCustomization.classicDesc") as string },
            { value: 'FAST', label: t("gameCustomization.fastMode") as string, icon: '⚡', description: t("gameCustomization.fastModeDesc") as string },
            { value: 'CHAOS', label: t("gameCustomization.chaosMode") as string, icon: '🔥', description: t("gameCustomization.chaosModeDesc") as string },
            { value: 'CUSTOM', label: t("gameCustomization.customMode") as string, icon: '⚙️', description: t("gameCustomization.customModeDesc") as string }
        ];

        presets.forEach(preset => {
            const card = this.createPresetCard(preset);
            presetGrid.appendChild(card);
        });

        section.appendChild(label);
        section.appendChild(presetGrid);
        return section;
    }

    //Creates a preset card button
    private createPresetCard(preset: { value: GamePreset; label: string; icon: string; description: string }): HTMLElement {
        const card = document.createElement('button');
        card.type = 'button';
        card.id = `preset-${preset.value}`;
        card.className = `
                rounded-xl p-4 pb-8 text-left cursor-pointer transition-transform
                bg-white/5 hover:bg-white/10 transform hover:-translate-y-1
                border-2 border-white/10 text-white `;
        
        const isActive = this.currentPreset === preset.value;
        
        card.className = `rounded-xl p-4 text-left cursor-pointer transition-all
            text-white border-2 h-[120px]`;

        if(isActive) {
            card.classList.add('bg-gradient-to-br', 'from-[#4fc3f7]', 'to-[#00b0ff]','border-[#4fc3f7]',);
        }else {
            card.classList.add('bg-white/5', 'border-white/10', 'hover:border-white/30');
        }

        const icon = document.createElement('div');
        icon.textContent = preset.icon;
        icon.className = `flex justify-center items-center text-2xl mb-1`;

        const title = document.createElement('div');
        title.textContent = preset.label;
        title.className = `font-semibold text-lg mb-1`;

        const desc = document.createElement('div');
        desc.textContent = preset.description;
        desc.className = `text-[10px] text-white/80`;

        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(desc);

        // Use tracked addEventListener
        const clickHandler = () => {
            this.currentPreset = preset.value;
            this.customSettings = {};
            this.refreshModal();
        };
        this.addMyEventListener(card, 'click', clickHandler);

        return card;
    }

    // Creates the advanced settings section
    private createAdvancedSection(): HTMLElement {
        const section = document.createElement('div');
        section.className = `mb-6 font-nunito ${this.currentPreset === 'CUSTOM' ? 'block' : 'hidden'}`;

        const label = document.createElement('h3');
        label.textContent = t("gameCustomization.advancedSettings") as string;
        label.className = 'text-white text-lg font-semibold mb-4';
        section.appendChild(label);

        const settingsContainer = document.createElement('div');
        settingsContainer.className = `bg-black/30 rounded-xl p-5 border border-white/10 mb-6`;

        // Ball Settings section
        const ballSection = document.createElement('div');
        ballSection.className = 'bg-black/30 rounded-xl p-5 border border-white/10 mb-4 text-white';

        ballSection.appendChild(this.createSettingsGroup(t("gameCustomization.ballSettings") as string, [
            { key: 'ball.speed.x', label: t("gameCustomization.ballSpeed") as string, min: 5, max: 30, step: 1, default: GameConfig.ball.speed.x },
            { key: 'ball.maxSpeed', label: t("gameCustomization.maxSpeed") as string, min: 10, max: 40, step: 1, default: GameConfig.ball.maxSpeed },
            { key: 'ball.speedIncrement', label: t("gameCustomization.speedIncrement") as string, min: 0.5, max: 3, step: 0.1, default: GameConfig.ball.speedIncrement }
        ]));
        section.appendChild(ballSection);

        //Paddle Settings section
        const paddleSection = document.createElement('div');
        paddleSection.className = 'bg-black/30 rounded-xl p-5 border border-white/10 mb-4';
        paddleSection.appendChild(this.createSettingsGroup(t("gameCustomization.paddleSettings") as string, [
            { key: 'paddle.speed', label: t("gameCustomization.paddleSpeed") as string, min: 5, max: 25, step: 1, default: GameConfig.paddle.speed },
            { key: 'paddle.depth', label: t("gameCustomization.paddleSize") as string, min: 2, max: 5, step: 0.5, default: GameConfig.paddle.depth }
        ]));
        section.appendChild(paddleSection);

        // Power-ups (only for CHAOS or CUSTOM) section
        if (this.currentPreset === 'CHAOS' || this.currentPreset === 'CUSTOM') {
            const powerUpSection = document.createElement('div');
            powerUpSection.className = 'bg-black/30 rounded-xl p-5 border border-white/10 mb-4';
            powerUpSection.appendChild(this.createPowerUpSettings());
            section.appendChild(powerUpSection);

        }
        return section;
    }

    //Creates a settings group with sliders
    private createSettingsGroup(title: string, settings: Array<{
        key: string;
        label: string;
        min: number;
        max: number;
        step: number;
        default: number;
    }>): HTMLElement {
        const group = document.createElement('div');
        group.className = `mb-5`;

        const groupTitle = document.createElement('h4');
        groupTitle.textContent = title;
        groupTitle.className = 'text-white text-sm font-semibold mb-3 uppercase tracking-wide drop-shadow-[0_0_10px_rgba(102,126,234,0.8)]';

        group.appendChild(groupTitle);

        settings.forEach(setting => {
            const control = this.createSliderControl(setting);
            group.appendChild(control);
        });

        return group;
    }

    // Creates a slider control with label and value display
    private createSliderControl(config: {
        key: string;
        label: string;
        min: number;
        max: number;
        step: number;
        default: number;
    }): HTMLElement {
        const container = document.createElement('div');
        container.className = 'mb-4';

        const labelRow = document.createElement('div');
        labelRow.className = 'flex justify-between items-center mb-2';

        const label = document.createElement('label');
        label.textContent = config.label;
        label.className = 'text-white/90 text-sm';

        const value = document.createElement('span');
        value.id = `value-${config.key}`;
        const currentValue = this.getNestedValue(config.key) ?? config.default;
        value.textContent = currentValue.toFixed(1);
        value.className = 'text-white font-semibold text-sm';

        labelRow.appendChild(label);
        labelRow.appendChild(value);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = config.min.toString();
        slider.max = config.max.toString();
        slider.step = config.step.toString();
        slider.value = currentValue.toString();
        slider.className = `
            w-full h-1.5 rounded-lg bg-white/10 appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-[18px]
            [&::-webkit-slider-thumb]:h-[18px]
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[#04b143ff]
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]
            [&::-moz-range-thumb]:w-[18px]
            [&::-moz-range-thumb]:h-[18px]
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[#04b143ff]
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)]`;

        const inputHandler = (e: Event) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            value.textContent = val.toFixed(1);
            this.setNestedValue(config.key, val);
            this.updatePreview();
        };
        this.addMyEventListener(slider, 'input', inputHandler);

        container.appendChild(labelRow);
        container.appendChild(slider);
        return container;
    }

    //Creates power-up settings section
    private createPowerUpSettings(): HTMLElement {
        const group = document.createElement('div');
        group.className = `mb-5`;

        const groupTitle = document.createElement('h4');
        groupTitle.textContent = t("gameCustomization.powerUps") as string;
        groupTitle.className = 'mb-4 text-white uppercase';

        group.appendChild(groupTitle);

        if (!this.customSettings.powerUps) {
            this.customSettings.powerUps = {
                enabled: this.currentPreset === 'CHAOS',
                types: this.currentPreset === 'CHAOS' 
                    ? ['SPEED_BOOST', 'ENLARGE_PADDLE', 'SLOW_MOTION']
                    : []
            };
        }

        // Enable/Disable toggle
        const toggleContainer = document.createElement('div');
        toggleContainer.className = `flex justify-between items-center mb-3`;

        const toggleLabel = document.createElement('label');
        toggleLabel.textContent = t("gameCustomization.enablePowerUps") as string;
        toggleLabel.className = 'text-white text-sm';

        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = this.customSettings.powerUps.enabled ?? false;
        toggle.className = 'w-5 h-5 cursor-pointer accent-[#04b143ff]';

        const toggleHandler = (e: Event) => {
            const enabled = (e.target as HTMLInputElement).checked;
            
            //  Make sure powerUps object exists
            if (!this.customSettings.powerUps) {
                this.customSettings.powerUps = { types: [] };
            }
            
            // Set enabled property directly on the object
            this.customSettings.powerUps.enabled = enabled;
            this.updatePreview();
        };
        this.addMyEventListener(toggle, 'change', toggleHandler);

        toggleContainer.appendChild(toggleLabel);
        toggleContainer.appendChild(toggle);
        group.appendChild(toggleContainer);

        // Power-up types
        const types: Array<{ key: string; label: string }> = [
            { key: 'SPEED_BOOST', label: t("gameCustomization.speedBoost") as string },
            { key: 'ENLARGE_PADDLE', label: t("gameCustomization.enlargePaddle") as string },
            { key: 'SLOW_MOTION', label: t("gameCustomization.slowMotion") as string }
        ];
        
        const typesContainer = document.createElement('div');
        typesContainer.className = 'flex flex-col gap-2 mt-3';

        types.forEach(type => {
            const checkbox = document.createElement('label');
            checkbox.className = 'flex items-center text-white/80 text-[13px] cursor-pointer';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = this.customSettings.powerUps.types.includes(type.key);
            input.className = 'mr-2 w-4 h-4 accent-[#04b143]';
        
            const label = document.createElement('span');
            label.textContent = type.label;

            // Use tracked addEventListener
            const checkboxHandler = (e: Event) => {
                const checked = (e.target as HTMLInputElement).checked;
                
                if (!this.customSettings.powerUps.types) {
                    this.customSettings.powerUps.types = [];
                }

                if (checked) {
                    if (!this.customSettings.powerUps.types.includes(type.key)) {
                        this.customSettings.powerUps.types.push(type.key);
                    }
                } else {
                    this.customSettings.powerUps.types = this.customSettings.powerUps.types.filter(
                        (t: string) => t !== type.key
                    );
                }
                
                this.updatePreview();
            };
            this.addMyEventListener(input, 'change', checkboxHandler);

            checkbox.appendChild(input);
            checkbox.appendChild(label);
            typesContainer.appendChild(checkbox);
        });

        group.appendChild(typesContainer);
        
        return group;
    }

    //Creates the preview section showing current settings
    private createPreviewSection(): HTMLElement {
        const section = document.createElement('div');
        section.id = 'preview-section';
        section.className = `bg-black/30 rounded-xl p-5 border border-white/10 mb-2`;

        const title = document.createElement('h3');
        title.textContent = t("gameCustomization.currentConfiguration") as string;
        title.className = 'text-white text-sm font-semibold mb-3 uppercase tracking-wide drop-shadow-[0_0_10px_rgba(102,126,234,0.8)]';

        const previewContent = document.createElement('div');
        previewContent.id = 'preview-content';
        previewContent.className = 'text-white/80 text-[13px] leading-[1.8] font-mono';

        section.appendChild(title);
        section.appendChild(previewContent);
        return section;
    }

    private createActionButtons(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'flex gap-3 justify-end';

        const cancelBtn = makeButton(t("common.cancel") as string, 'cancel-game-btn', 'block', () => this.handleCancel());
        const applyBtn = makeButton(t("gameCustomization.apply&Start") as string, 'apply-game-btn', 'block', () => this.handleApply());

        container.appendChild(cancelBtn);
        container.appendChild(applyBtn);
        return container;
    }

    //Updates the preview with current settings
    private updatePreview(): void {
        const previewContent = document.getElementById('preview-content');
        if (!previewContent) 
            return;

        const config = this.getCurrentConfig();
        
        // power-up info string
        let powerUpInfo = '';
        if (config.powerUps.enabled) {
            const types = config.powerUps.types || [];
            const typeNames = types.map((t: string) => 
                t.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            ).join(', ');
            powerUpInfo = `
                <strong>${t("gameCustomization.powerUps") as string}:</strong> Enabled ✓<br>
                <strong>${t("gameCustomization.types") as string}:</strong> ${typeNames || 'None selected'}<br>
            `;
        }

        previewContent.innerHTML = `
            <strong>${t("gameCustomization.preset") as string}:</strong> ${this.currentPreset}<br>
            <strong>${t("gameCustomization.ballSpeed") as string}:</strong> ${config.ball.speed.x} <br>
            <strong>${t("gameCustomization.maxSpeed") as string}:</strong> ${config.ball.maxSpeed} <br>
            <strong>${t("gameCustomization.speedIncrement") as string}:</strong> ${config.ball.speedIncrement} %<br>
            <strong>${t("gameCustomization.paddleSpeed") as string}:</strong> ${config.paddle.speed} <br>
            <strong>${t("gameCustomization.paddleSize") as string}:</strong> ${config.paddle.depth}<br>
            ${powerUpInfo}
        `;
    }

    //Refreshes the entire modal (used when preset changes)
    private refreshModal(): void {
        if (!this.modal) return;
        
        // Clear existing event listeners before innerHTML wipe
        // (new ones will be added when recreating)
        this.eventListeners.forEach(({element, event, handler}) => {
            if(this.modal?.contains(element as Node)){
                element.removeEventListener(event, handler);
            }
        });
        // Keep overlay listener, remove modal content listeners
        this.eventListeners = this.eventListeners.filter(
            ({element}) => element === this.overlay
        );

        // Only reset if switching AWAY from CUSTOM
        if (this.currentPreset !== 'CUSTOM') {
            this.customSettings = {};
        }
        this.modal.innerHTML = '';
        
        const header = this.createHeader();
        this.modal.appendChild(header);

        const presetSection = this.createPresetSection();
        this.modal.appendChild(presetSection);

        if (this.showAdvanced) {
            const advancedSection = this.createAdvancedSection();
            this.modal.appendChild(advancedSection);
        }

        const previewSection = this.createPreviewSection();
        this.modal.appendChild(previewSection);

        const actions = this.createActionButtons();
        this.modal.appendChild(actions);

        this.updatePreview();
    }

    //Handles apply button click
    private handleApply(): void {
        const settings: CustomGameSettings = {
            preset: this.currentPreset,
            config: this.currentPreset === 'CUSTOM' ? this.customSettings : undefined
        };

        this.applyUserSettings(settings);
        this.close();
    }

    // Handles cancel button click
    private handleCancel(): void {
        if (this.onCancel) {
            this.onCancel();
        }
        this.close();
    }

    private getCurrentConfig(): typeof GameConfig {
        const settings: CustomGameSettings = {
            preset: this.currentPreset,
            config: this.currentPreset === 'CUSTOM' ? this.customSettings : undefined
        };
        
        const presetConfig = gameConfigManager.getPresetConfig(this.currentPreset);
        
        if (this.currentPreset === 'CUSTOM' && this.customSettings) {
            return this.mergeConfigLocally(presetConfig, this.customSettings);
        }
        
        return presetConfig;
    }

    private mergeConfigLocally(base: any, overrides: any): any {
        const result = JSON.parse(JSON.stringify(base)); // Deep clone
        
        // Simple deep merge
        const merge = (target: any, source: any) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    merge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        };
        
        merge(result, overrides);
        return result;
    }

    // Helper: Get nested object value by dot notation key
    private getNestedValue(key: string): number | undefined {
        const keys = key.split('.');
        let value: any = this.customSettings;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }
        
        return typeof value === 'number' ? value : undefined;
    }

    // Helper: Set nested object value by dot notation key
    private setNestedValue(key: string, value: number | boolean): void {
        const keys = key.split('.');
        let obj: any = this.customSettings;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj) || typeof obj[k] !== 'object') {
                obj[k] = {};
            }
            obj = obj[k];
        }
        
        obj[keys[keys.length - 1]] = value;
    }
}

// Singleton instance tracking
let currentCustomizationUI: GameCustomizationUI | null = null;

 // Utility function to create and open customization UI. Ensures only one instance exists at a time
export function openGameCustomization(container: HTMLElement, 
    applyUserSettings: (settings: CustomGameSettings) => void, onCancel?: () => void): GameCustomizationUI {

        if(currentCustomizationUI){
            currentCustomizationUI.close();
            currentCustomizationUI = null;
        }
        const ui = new GameCustomizationUI({container, applyUserSettings, 
            onCancel: () => {
                if(onCancel)
                    onCancel();
                currentCustomizationUI = null;
            }, 
            showAdvanced: true
        });
        currentCustomizationUI = ui;
        ui.open();
    return (ui);
}

export function closeAnyOpenCustomizationUI(): void {
    if(currentCustomizationUI){
        currentCustomizationUI.close();
        currentCustomizationUI = null;
    }
}