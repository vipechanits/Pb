/**
 * Module Loader System - Manages active/inactive modules
 * Allows dynamic enabling/disabling of features at runtime
 */

export type ModuleConfig = {
  name: string;
  enabled: boolean;
  description: string;
  icon?: string;
};

export type ModulesConfig = Record<string, ModuleConfig>;

export const DEFAULT_MODULES: ModulesConfig = {
  registration: { name: 'registration', enabled: true, description: 'User signup, login, verification' },
  activation: { name: 'activation', enabled: true, description: 'User activation, 8-payment system' },
  binary: { name: 'binary', enabled: true, description: 'Binary tree, pair matching' },
  matrix: { name: 'matrix', enabled: true, description: 'Global matrix, 5-level income' },
  reentry: { name: 'reentry', enabled: true, description: 'Multi-cycle re-entry' },
  admin: { name: 'admin', enabled: true, description: 'Admin dashboard, management' },
  backup: { name: 'backup', enabled: true, description: 'Backup and restore' },
};

/**
 * Check if a module is enabled
 */
export function isModuleEnabled(moduleName: string, config?: ModulesConfig): boolean {
  const modules = config || DEFAULT_MODULES;
  return modules[moduleName]?.enabled ?? true;
}

/**
 * Get all enabled modules
 */
export function getEnabledModules(config?: ModulesConfig): string[] {
  const modules = config || DEFAULT_MODULES;
  return Object.entries(modules)
    .filter(([_, config]) => config.enabled)
    .map(([name, _]) => name);
}

/**
 * Get all available modules
 */
export function getAvailableModules(config?: ModulesConfig): ModulesConfig {
  return config || DEFAULT_MODULES;
}

/**
 * Module registry for runtime feature availability checks
 */
export class ModuleRegistry {
  private static enabledModules: Set<string> = new Set(Object.keys(DEFAULT_MODULES));

  static initialize(config: ModulesConfig): void {
    this.enabledModules.clear();
    Object.entries(config).forEach(([name, moduleConfig]) => {
      if (moduleConfig.enabled) {
        this.enabledModules.add(name);
      }
    });
  }

  static isEnabled(moduleName: string): boolean {
    return this.enabledModules.has(moduleName);
  }

  static getEnabledModules(): string[] {
    return Array.from(this.enabledModules);
  }

  static enableModule(moduleName: string): void {
    this.enabledModules.add(moduleName);
  }

  static disableModule(moduleName: string): void {
    this.enabledModules.delete(moduleName);
  }

  static reset(): void {
    this.enabledModules.clear();
    Object.keys(DEFAULT_MODULES).forEach(name => this.enabledModules.add(name));
  }
}

// Initialize on import
ModuleRegistry.initialize(DEFAULT_MODULES);
