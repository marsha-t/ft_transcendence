import * as BABYLON from '@babylonjs/core';
import { GameConfig } from './GameConfig';


/**
 * PowerUpTypes - Enum of possible power-up types
 * Used by PowerUpManager and PowerUp entities
 */
export type PowerUpTypes =  'SPEED_BOOST' | 'ENLARGE_PADDLE' | 'SLOW_MOTION';

/**
 * PowerUp - Represents a power-up item in the 3D scene
 * used by PowerUpManager to spawn and manage power-ups
 */
export interface PowerUp {
    mesh: BABYLON.Mesh;
    type: PowerUpTypes;
    position: {x: number; z: number};
    glowLayer?: BABYLON.GlowLayer;
}

/**
 * AIConfig - Configuration for AI-controlled paddles
 * Used by PongGame to determine AI behavior
 */
export interface AIConfig {
    aiEnabled: boolean;
    aiSide: 'LEFT' | 'RIGHT';
}

/**
 * DeepPartial - Utility type for creating partial versions of nested objects
 * Used for defining custom game settings with optional overrides
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * GamePreset - Enum of predefined game presets
 * Used by CustomGameSettings to specify selected preset
 */
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
 * type ControlMode - Defines the control scheme for paddles
 * Used by InputHandler to set up human or AI control
 */
export type ControlMode = 'HUMAN' | 'AI';