import { GameConfig } from "./GameConfig";


type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type GamePreset = 'CLASSIC' | 'FAST' | 'CHAOS' | 'CUSTOM';


/**
 * CustomGameSettings - Data structure passed from UI when user applies a preset or custom config
 *
 * Responsibilities:
 * - Defines which preset is active
 * - Optionally carries user-defined overrides (only used when preset is 'CUSTOM')
 *
 * Usage:
 * - Passed to gameConfigManager.applyCustomizations()
 * - Stored and used to compute final runtime configuration
 */
export interface CustomGameSettings {
    preset: GamePreset;
    config?: DeepPartial<typeof GameConfig>;
}

/**
 * GameConfigManager Class
 * 
 * PURPOSE:
 * - Manages game configuration dynamically at runtime
 * - Merges default GameConfig with user customizations
 * - Provides a single source of truth for game settings
 * - Supports preset modes (Classic, Fast, Chaos) and custom settings
 * 
 * HOW IT WORKS:
 * 1. Starts with base GameConfig from GameConfig.ts
 * 2. User applies customizations through applyCustomizations()
 * 3. Merges base config + preset config + custom config
 * 4. Returns merged config through the 'current' getter
 * 5. Can reset back to defaults anytime
 */

class GameConfigManager{
    private customConfig: DeepPartial<typeof GameConfig> = {};
    private activePreset: GamePreset = 'CLASSIC';

    private readonly presets: Record<GamePreset, DeepPartial<typeof GameConfig>> = {
        CLASSIC: {}, //default version 
        FAST: {
            ball: {
                speed: {
                    x: 18,
                    z: 0
                },
                maxSpeed: 22,
                speedIncrement: 2.0
            },
            paddle: {
                speed: 15
            }
        },
        CHAOS: {
            ball: {
                speed: {
                    x: 20,
                    z: 0
                },
                maxSpeed: 26,
                speedIncrement: 2.5
            },
            paddle: {
                speed: 18
            },
            powerUps: {
                enabled: true,
                spawnInterval: 5000,
                duration: 3000,
                types: ['SPEED_BOOST', 'ENLARGE_PADDLE', 'SLOW_MOTION']
            }
        },
        CUSTOM: {} // will be filled by the user
    };

    /**
     * Returns the fully merged current configuration
     * This is the single source of truth used by all game systems
     */
    get current(): typeof GameConfig {
        const presetConfig = this.presets[this.activePreset];
        
        return this.mergeConfig(
            GameConfig,
            presetConfig,
            this.customConfig
        );
    }

   /** Returns the name of the currently active preset */
    get preset(): GamePreset {
        return this.activePreset;
    }

    //Returns the configuration for a specific preset useful for UI test which preset being used
    public getPresetConfig(preset: GamePreset): typeof GameConfig{
        return this.mergeConfig(GameConfig, this.presets[preset]);
    }

    /**
     * Applies a new preset and/or custom settings
     * Called from customization UI when user confirms changes
    */
    public applyCustomizations(settings: CustomGameSettings): void {
        this.activePreset = settings.preset;

        if(settings.config){
            this.customConfig = settings.config;
        }else {
            this.customConfig = {};
        }
      const finalConfig = this.current;

    }

    public reset(): void {
        this.activePreset = 'CLASSIC';
        this.customConfig = {};
    }

   /**
   * Deep merges multiple configuration objects
   * Later configs override earlier ones
   * 
   * 1. Start with base config (copy it)
   * 2. For each override config:
   *    - Loop through all properties
   *    - If property is an object, recursively merge
   *    - If property is a primitive (number/string), replace
   * 3. Return merged result
   * 
   */
   private mergeConfig<T extends object>(
        base: T,
        ... overrides: DeepPartial<T>[]
    ): T{
        let result = {... base} as T;

        for (const override of overrides){
            result = this.deepMerge(result, override);
        }
        return result;
   }

   //Recursively merges two objects
   private deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
    const result = { ...target } as T;

    for (const key in source) {
      const sourceValue = source[key];
      
      // Skip undefined values
      if (sourceValue === undefined) {
        continue;
      }

      // If both are objects (and not arrays), merge recursively
      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        key in target &&
        typeof (target as any)[key] === 'object'
      ) {
        result[key] = this.deepMerge(
          (target as any)[key],
          sourceValue as any
        ) as any;
      } else {
        // Otherwise, just replace the value
        result[key] = sourceValue as any;
      }
    }
    return result;
  }
}
export const gameConfigManager = new GameConfigManager();
export type {DeepPartial};

