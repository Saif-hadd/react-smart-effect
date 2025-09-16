import { Plugin } from 'vite';
import { transformAsync } from '@babel/core';
import babelPluginSmartEffect from './babel';

interface VitePluginOptions {
  autoFix?: boolean;
  warnOnly?: boolean;
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
}

/**
 * Vite plugin for analyzing useSmartEffect dependencies
 */
export function vitePluginSmartEffect(options: VitePluginOptions = {}): Plugin {
  const {
    autoFix = false,
    warnOnly = true,
    include = /\.(tsx?|jsx?)$/,
    exclude = /node_modules/
  } = options;

  return {
    name: 'vite-plugin-react-smart-effect',
    enforce: 'pre',
    
    async transform(code: string, id: string) {
      // Check if file should be processed
      if (!shouldTransform(id, include, exclude)) {
        return null;
      }

      try {
        const result = await transformAsync(code, {
          filename: id,
          plugins: [
            [babelPluginSmartEffect, { autoFix, warnOnly }]
          ],
          parserOpts: {
            sourceType: 'module',
            allowImportExportEverywhere: true,
            plugins: [
              'jsx',
              'typescript',
              'decorators-legacy',
              'classProperties'
            ]
          }
        });

        return result?.code ? {
          code: result.code,
          map: result.map
        } : null;
      } catch (error) {
        if (warnOnly) {
          console.warn(`[vite-plugin-react-smart-effect] ${id}: ${error}`);
          return null;
        }
        throw error;
      }
    }
  };
}

function shouldTransform(
  id: string, 
  include: VitePluginOptions['include'],
  exclude: VitePluginOptions['exclude']
): boolean {
  const normalizedId = id.replace(/\\/g, '/');

  // Check exclude patterns
  if (exclude) {
    const excludePatterns = Array.isArray(exclude) ? exclude : [exclude];
    for (const pattern of excludePatterns) {
      if (pattern instanceof RegExp ? pattern.test(normalizedId) : normalizedId.includes(pattern)) {
        return false;
      }
    }
  }

  // Check include patterns
  if (include) {
    const includePatterns = Array.isArray(include) ? include : [include];
    for (const pattern of includePatterns) {
      if (pattern instanceof RegExp ? pattern.test(normalizedId) : normalizedId.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  return true;
}

// Export configuration helper
export function createViteConfig(options: VitePluginOptions = {}) {
  return {
    plugins: [
      vitePluginSmartEffect(options)
    ]
  };
}