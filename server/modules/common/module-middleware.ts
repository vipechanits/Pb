/**
 * Module Middleware - Server-side module management
 * Enforces module access control based on system configuration
 */

import { type Request, Response, NextFunction } from 'express';
import { db } from '../../db';
import { systemConfig } from '@shared/schema';

export const enabledModulesMap = new Map<string, boolean>();

/**
 * Initialize enabled modules from database
 */
export async function initializeModules() {
  try {
    const config = await db.select().from(systemConfig).limit(1);
    if (config.length > 0 && config[0].enabledModules) {
      const modules = JSON.parse(config[0].enabledModules as any);
      modules.forEach((module: string) => {
        enabledModulesMap.set(module, true);
      });
    } else {
      // Default: all modules enabled
      const defaultModules = ['registration', 'activation', 'binary', 'matrix', 'reentry', 'admin', 'backup'];
      defaultModules.forEach(m => enabledModulesMap.set(m, true));
    }
    console.log('[MODULES] Initialized:', Array.from(enabledModulesMap.keys()));
  } catch (error) {
    console.error('[MODULES] Failed to initialize:', error);
  }
}

/**
 * Check if module is enabled
 */
export function isModuleEnabled(moduleName: string): boolean {
  return enabledModulesMap.get(moduleName) ?? true;
}

/**
 * Middleware to enforce module access control
 */
export function moduleAccessMiddleware(module: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isModuleEnabled(module)) {
      return res.status(403).json({
        error: 'Module not available',
        message: `The ${module} module is currently disabled`,
      });
    }
    next();
  };
}

/**
 * Refresh module configuration from database
 * Called by admin when updating system config
 */
export async function refreshModuleConfiguration() {
  enabledModulesMap.clear();
  await initializeModules();
}

/**
 * Get all enabled modules
 */
export function getEnabledModules(): string[] {
  return Array.from(enabledModulesMap.keys()).filter(m => enabledModulesMap.get(m));
}
