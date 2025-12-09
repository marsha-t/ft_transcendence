import { CustomGameSettings, GamePreset, gameConfigManager } from '../graphics/GameConfigManager';
import { GameConfig } from '../graphics/GameConfig';

/**
 * GameCustomizationUI
 * 
 * PURPOSE:
 * - Provides DOM-based UI for game customization
 * - Supports preset selection (Classic, Fast, Chaos, Custom)
 * - Allows fine-tuning of game parameters
 * - Consistent interface across AI, P2P, and Tournament modes
 */

export interface CustomizationUIConfig {
    applyUserSettings: (settings: CustomGameSettings) => void;
    onCancel?: () => void;
    container: HTMLElement;
    showAdvanced?: boolean;
}

export class GameCustomizationUI {
    private container: HTMLElement;
    private overlay: HTMLDivElement | null = null;
    private modal: HTMLDivElement | null = null;
    private applyUserSettings: (settings: CustomGameSettings) => void;
    private onCancel?: () => void;
    private showAdvanced: boolean;
    
    private currentPreset: GamePreset = 'CLASSIC';
    private customSettings: any = {};

    constructor(config: CustomizationUIConfig) {
        this.container = config.container;
        this.applyUserSettings = config.applyUserSettings;
        this.onCancel = config.onCancel;
        this.showAdvanced = config.showAdvanced ?? true;
    }

    /**
     * Opens the customization modal
     */
    public open(): void {
        this.createModal();
        this.updatePreview();
    }

    /**
     * Closes and cleans up the modal
     */
    public close(): void {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            this.modal = null;
        }
    }

    /**
     * Creates the main modal structure
     */
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
            bg-[var(--color-modal-background)]
        `;


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

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.handleCancel();
            }
        });
    }

    /**
     * Creates the modal header
     */
    private createHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = `mb-6 border-b-2 border-white/10 pb-4 `;

        const title = document.createElement('h2');
        title.textContent = '🎮 Game Customization';
        title.style.cssText = `
            margin: 0;
            color: #fff;
            font-size: 28px;
            font-weight: 700;
        `;

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Choose a preset or customize your gaming experience';
        subtitle.style.cssText = `
            margin: 8px 0 0 0;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
        `;

        header.appendChild(title);
        header.appendChild(subtitle);
        return header;
    }

    /**
     * Creates the preset selection section
     */
    private createPresetSection(): HTMLElement {
        const section = document.createElement('div');
        section.className = `
            mb- 24px;
        `;

        const label = document.createElement('h3');
        label.textContent = 'Game Mode Presets';
        label.style.cssText = `
            color: #fff;
            font-size: 18px;
            margin: 0 0 16px 0;
            font-weight: 600;
        `;

        const presetGrid = document.createElement('div');
        presetGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
        `;

        const presets: Array<{
            value: GamePreset;
            label: string;
            icon: string;
            description: string;
        }> = [
            { value: 'CLASSIC', label: 'Classic', icon: '🏓', description: 'Traditional pong gameplay' },
            { value: 'FAST', label: 'Fast Mode', icon: '⚡', description: 'Increased speed and intensity' },
            { value: 'CHAOS', label: 'Chaos Mode', icon: '🔥', description: 'Power-ups and mayhem' },
            { value: 'CUSTOM', label: 'Custom', icon: '⚙️', description: 'Fine-tune everything' }
        ];

        presets.forEach(preset => {
            const card = this.createPresetCard(preset);
            presetGrid.appendChild(card);
        });

        section.appendChild(label);
        section.appendChild(presetGrid);
        return section;
    }

    /**
     * Creates a preset card button
     */
    private createPresetCard(preset: { value: GamePreset; label: string; icon: string; description: string }): HTMLElement {
        const card = document.createElement('button');
        card.type = 'button';
        card.id = `preset-${preset.value}`;
        
        const isActive = this.currentPreset === preset.value;
        
        card.style.cssText = `
            background: ${isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.05)'};
            border: 2px solid ${isActive ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
            border-radius: 12px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            color: #fff;
        `;

        const icon = document.createElement('div');
        icon.textContent = preset.icon;
        icon.style.cssText = `
            font-size: 32px;
            margin-bottom: 8px;
        `;

        const title = document.createElement('div');
        title.textContent = preset.label;
        title.style.cssText = `
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
        `;

        const desc = document.createElement('div');
        desc.textContent = preset.description;
        desc.style.cssText = `
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.4;
        `;

        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(desc);

        // Hover effect
        card.addEventListener('mouseenter', () => {
            if (this.currentPreset !== preset.value) {
                card.style.background = 'rgba(255, 255, 255, 0.1)';
                card.style.transform = 'translateY(-2px)';
            }
        });

        card.addEventListener('mouseleave', () => {
            if (this.currentPreset !== preset.value) {
                card.style.background = 'rgba(255, 255, 255, 0.05)';
                card.style.transform = 'translateY(0)';
            }
        });

        card.addEventListener('click', () => {
            this.currentPreset = preset.value;
            this.customSettings = {};
            this.refreshModal();
        });

        return card;
    }

    /**
     * Creates the advanced settings section
     */
    private createAdvancedSection(): HTMLElement {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 24px;
            display: ${this.currentPreset === 'CUSTOM' ? 'block' : 'none'};
        `;
        section.id = 'advanced-settings';

        const label = document.createElement('h3');
        label.textContent = 'Advanced Settings';
        label.style.cssText = `
            color: #fff;
            font-size: 18px;
            margin: 0 0 16px 0;
            font-weight: 600;
        `;

        const settingsContainer = document.createElement('div');
        settingsContainer.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        // Ball Settings
        settingsContainer.appendChild(this.createSettingsGroup('Ball Settings', [
            { key: 'ball.speed.x', label: 'Ball Speed', min: 5, max: 30, step: 1, default: GameConfig.ball.speed.x },
            { key: 'ball.maxSpeed', label: 'Max Speed', min: 10, max: 40, step: 1, default: GameConfig.ball.maxSpeed },
            { key: 'ball.speedIncrement', label: 'Speed Increment', min: 0.5, max: 3, step: 0.1, default: GameConfig.ball.speedIncrement }
        ]));

        // Paddle Settings
        settingsContainer.appendChild(this.createSettingsGroup('Paddle Settings', [
            { key: 'paddle.speed', label: 'Paddle Speed', min: 5, max: 25, step: 1, default: GameConfig.paddle.speed },
            { key: 'paddle.depth', label: 'Paddle Size', min: 2, max: 5, step: 0.5, default: GameConfig.paddle.depth }
        ]));

        // Power-ups (only for CHAOS or CUSTOM)
        if (this.currentPreset === 'CHAOS' || this.currentPreset === 'CUSTOM') {
            settingsContainer.appendChild(this.createPowerUpSettings());
        }

        section.appendChild(label);
        section.appendChild(settingsContainer);
        return section;
    }

    /**
     * Creates a settings group with sliders
     */
    private createSettingsGroup(title: string, settings: Array<{
        key: string;
        label: string;
        min: number;
        max: number;
        step: number;
        default: number;
    }>): HTMLElement {
        const group = document.createElement('div');
        group.style.cssText = `
            margin-bottom: 20px;
        `;

        const groupTitle = document.createElement('h4');
        groupTitle.textContent = title;
        groupTitle.style.cssText = `
            color: #667eea;
            font-size: 14px;
            margin: 0 0 12px 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        group.appendChild(groupTitle);

        settings.forEach(setting => {
            const control = this.createSliderControl(setting);
            group.appendChild(control);
        });

        return group;
    }

    /**
     * Creates a slider control with label and value display
     */
    private createSliderControl(config: {
        key: string;
        label: string;
        min: number;
        max: number;
        step: number;
        default: number;
    }): HTMLElement {
        const container = document.createElement('div');
        container.style.cssText = `
            margin-bottom: 16px;
        `;

        const labelRow = document.createElement('div');
        labelRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        `;

        const label = document.createElement('label');
        label.textContent = config.label;
        label.style.cssText = `
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        `;

        const value = document.createElement('span');
        value.id = `value-${config.key}`;
        const currentValue = this.getNestedValue(config.key) ?? config.default;
        value.textContent = currentValue.toFixed(1);
        value.style.cssText = `
            color: #667eea;
            font-weight: 600;
            font-size: 14px;
        `;

        labelRow.appendChild(label);
        labelRow.appendChild(value);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = config.min.toString();
        slider.max = config.max.toString();
        slider.step = config.step.toString();
        slider.value = currentValue.toString();
        slider.style.cssText = `
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: rgba(255, 255, 255, 0.1);
            outline: none;
            -webkit-appearance: none;
        `;

        // Slider styling
        const style = document.createElement('style');
        style.textContent = `
            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #667eea;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #667eea;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
        `;
        document.head.appendChild(style);

        slider.addEventListener('input', (e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            value.textContent = val.toFixed(1);
            this.setNestedValue(config.key, val);
            this.updatePreview();
        });

        container.appendChild(labelRow);
        container.appendChild(slider);
        return container;
    }

    /**
     * Creates power-up settings section
     */
    private createPowerUpSettings(): HTMLElement {
        const group = document.createElement('div');
        group.style.cssText = `
            margin-bottom: 20px;
        `;

        const groupTitle = document.createElement('h4');
        groupTitle.textContent = 'Power-Ups';
        groupTitle.style.cssText = `
            color: #667eea;
            font-size: 14px;
            margin: 0 0 12px 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        group.appendChild(groupTitle);

        // Enable/Disable toggle
        const toggleContainer = document.createElement('div');
        toggleContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        `;

        const toggleLabel = document.createElement('label');
        toggleLabel.textContent = 'Enable Power-Ups';
        toggleLabel.style.cssText = `
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        `;

        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = this.currentPreset === 'CHAOS';
        toggle.style.cssText = `
            width: 20px;
            height: 20px;
            cursor: pointer;
        `;

        toggle.addEventListener('change', (e) => {
            const enabled = (e.target as HTMLInputElement).checked;
            this.setNestedValue('powerUps.enabled', enabled);
            this.updatePreview();
        });

        toggleContainer.appendChild(toggleLabel);
        toggleContainer.appendChild(toggle);
        group.appendChild(toggleContainer);

        // Power-up types
        const types = ['SPEED_BOOST', 'ENLARGE_PADDLE', 'SLOW_MOTION'];
        const typesContainer = document.createElement('div');
        typesContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 12px;
        `;

        types.forEach(type => {
            const checkbox = document.createElement('label');
            checkbox.style.cssText = `
                display: flex;
                align-items: center;
                color: rgba(255, 255, 255, 0.8);
                font-size: 13px;
                cursor: pointer;
            `;

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = this.currentPreset === 'CHAOS';
            input.style.cssText = `
                margin-right: 8px;
                width: 16px;
                height: 16px;
            `;

            const label = document.createElement('span');
            label.textContent = type.replace(/_/g, ' ');

            checkbox.appendChild(input);
            checkbox.appendChild(label);
            typesContainer.appendChild(checkbox);
        });

        group.appendChild(typesContainer);
        return group;
    }

    /**
     * Creates the preview section showing current settings
     */
    private createPreviewSection(): HTMLElement {
        const section = document.createElement('div');
        section.id = 'preview-section';
        section.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const title = document.createElement('h3');
        title.textContent = '📊 Current Configuration';
        title.style.cssText = `
            color: #fff;
            font-size: 16px;
            margin: 0 0 12px 0;
            font-weight: 600;
        `;

        const previewContent = document.createElement('div');
        previewContent.id = 'preview-content';
        previewContent.style.cssText = `
            color: rgba(255, 255, 255, 0.8);
            font-size: 13px;
            line-height: 1.8;
            font-family: 'Courier New', monospace;
        `;

        section.appendChild(title);
        section.appendChild(previewContent);
        return section;
    }

    /**
     * Creates action buttons (Apply/Cancel)
     */
    private createActionButtons(): HTMLElement {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.type = 'button';
        cancelBtn.style.cssText = `
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = 'rgba(255, 255, 255, 0.15)';
        });

        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        });

        cancelBtn.addEventListener('click', () => this.handleCancel());

        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply & Start Game';
        applyBtn.type = 'button';
        applyBtn.style.cssText = `
            padding: 12px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        `;

        applyBtn.addEventListener('mouseenter', () => {
            applyBtn.style.transform = 'translateY(-2px)';
            applyBtn.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
        });

        applyBtn.addEventListener('mouseleave', () => {
            applyBtn.style.transform = 'translateY(0)';
            applyBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });

        applyBtn.addEventListener('click', () => this.handleApply());

        container.appendChild(cancelBtn);
        container.appendChild(applyBtn);
        return container;
    }

    /**
     * Updates the preview with current settings
     */
    private updatePreview(): void {
        const previewContent = document.getElementById('preview-content');
        if (!previewContent) return;

        const config = this.getCurrentConfig();
        
        previewContent.innerHTML = `
            <strong>Preset:</strong> ${this.currentPreset}<br>
            <strong>Ball Speed:</strong> ${config.ball.speed.x} units/s<br>
            <strong>Max Speed:</strong> ${config.ball.maxSpeed} units/s<br>
            <strong>Speed Increment:</strong> ${config.ball.speedIncrement}<br>
            <strong>Paddle Speed:</strong> ${config.paddle.speed} units/s<br>
            <strong>Paddle Size:</strong> ${config.paddle.depth} units<br>
            ${config.powerUps.enabled ? '<strong>Power-Ups:</strong> Enabled ✓' : ''}
        `;
    }

    /**
     * Refreshes the entire modal (used when preset changes)
     */
    private refreshModal(): void {
        if (!this.modal) return;
        
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

    /**
     * Handles apply button click
     */
    private handleApply(): void {
        const settings: CustomGameSettings = {
            preset: this.currentPreset,
            config: this.currentPreset === 'CUSTOM' ? this.customSettings : undefined
        };

        this.applyUserSettings(settings);
        this.close();
    }

    /**
     * Handles cancel button click
     */
    private handleCancel(): void {
        if (this.onCancel) {
            this.onCancel();
        }
        this.close();
    }

    /**
     * Gets current merged configuration
     */
    private getCurrentConfig(): typeof GameConfig {
        const settings: CustomGameSettings = {
            preset: this.currentPreset,
            config: this.customSettings
        };
        
        gameConfigManager.applyCustomizations(settings);
        return gameConfigManager.current;
    }

    /**
     * Helper: Get nested object value by dot notation key
     */
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

    /**
     * Helper: Set nested object value by dot notation key
     */
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

/**
 * Utility function to create and open customization UI
 */
export function openGameCustomization(container: HTMLElement, applyUserSettings: (settings: CustomGameSettings) => void, onCancel?: () => void): 
    GameCustomizationUI {
    
    const ui = new GameCustomizationUI({container, applyUserSettings, onCancel, showAdvanced: true});
    
    ui.open();
    
    return (ui);
}