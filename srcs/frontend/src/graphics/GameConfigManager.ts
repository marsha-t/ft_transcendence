import { GameConfig } from "./GameConfig";


type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type GamePreset = 'CLASSIC' | 'FAST' | 'CHAOS' | 'CUSTOM';


/**
* Interface for custom game settings that users can modify
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
                maxSpeed: 30,
                speedIncrement: 2.5
            },
            paddle: {
                speed: 18
            },
            powerUps: {
                enabled: true,
                spawnInterval: 3000,
                duration: 3000,
                types: ['SPEED_BOOST', 'ENLARGE_PADDLE', 'SLOW_MOTION']
            }
        },
        CUSTOM: {} // will be filled by the user
    };

    //getter:Returns the final merged configuration, Return the merged config
    //    This is what PongGame and other classes should use
    //     MERGE ORDER (later overrides earlier):
    //     1. Base GameConfig (from GameConfig.ts)
    //     2. Preset config (CLASSIC/FAST/CHAOS)
    //      3. Custom user settings

    get current(): typeof GameConfig {
        const presetConfig = this.presets[this.activePreset];
        
        return this.mergeConfig(
            GameConfig,
            presetConfig,
            this.customConfig
        );
    }

    // Getter for preset name
    get preset(): GamePreset {
        return this.activePreset;
    }


    applyCustomizations(settings: CustomGameSettings): void {
        this.activePreset = settings.preset;

        if(settings.config){
            this.customConfig = settings.config;
        }else {
            this.customConfig = {};
        }

        console.log('Applied customizations:', {
            preset: this.activePreset,
            hasCustomConfig: !!settings.config
          });
    }

    reset(): void {
        this.activePreset = 'CLASSIC';
        this.customConfig = {};
        console.log('Reset to default configuration');
    }


    //Returns the configuration for a specific preset useful for UI test which preset being used
    getPresetConfig(preset: GamePreset): typeof GameConfig{
        return this.mergeConfig(GameConfig, this.presets[preset]);
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


  //debug
  validateConfig(config: DeepPartial<typeof GameConfig>): boolean {
    try {
      // Check for negative values that don't make sense
      if (config.ball?.speed?.x !== undefined && config.ball.speed.x <= 0) {
        console.error('Ball speed must be positive');
        return false;
      }

      if (config.paddle?.speed !== undefined && config.paddle.speed <= 0) {
        console.error('Paddle speed must be positive');
        return false;
      }

      if (config.ball?.maxSpeed !== undefined && config.ball.maxSpeed <= 0) {
        console.error(' Max speed must be positive');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Config validation error:', error);
      return false;
    }
  }
}
export const gameConfigManager = new GameConfigManager();
export type {DeepPartial};