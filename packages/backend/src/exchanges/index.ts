// Base
export { ExchangeAdapter, type AdapterConfig, type FetchResult } from './base/exchange-adapter.js';

// Public adapters
export { HyperliquidAdapter } from './public/hyperliquid.adapter.js';
export { DydxV4Adapter } from './public/dydx.adapter.js';
export { GmxAdapter } from './public/gmx.adapter.js';
export { ParadexAdapter } from './public/paradex.adapter.js';
export { MyxAdapter } from './public/myx.adapter.js';

// Authenticated adapters
export { LighterAdapter } from './authenticated/lighter.adapter.js';
export { AsterAdapter } from './authenticated/aster.adapter.js';
export { VariationalAdapter } from './authenticated/variational.adapter.js';
export { EdgeXAdapter } from './authenticated/edgex.adapter.js';
export { GrvtAdapter } from './authenticated/grvt.adapter.js';

// Special adapters
export { JupiterAdapter } from './special/jupiter.adapter.js';

import type { ExchangeId } from '@funding-dashboard/shared';
import { config } from '../config/index.js';
import type { ExchangeAdapter } from './base/exchange-adapter.js';

// Import all adapters for factory
import { HyperliquidAdapter } from './public/hyperliquid.adapter.js';
import { DydxV4Adapter } from './public/dydx.adapter.js';
import { GmxAdapter } from './public/gmx.adapter.js';
import { ParadexAdapter } from './public/paradex.adapter.js';
import { MyxAdapter } from './public/myx.adapter.js';
import { LighterAdapter } from './authenticated/lighter.adapter.js';
import { AsterAdapter } from './authenticated/aster.adapter.js';
import { VariationalAdapter } from './authenticated/variational.adapter.js';
import { EdgeXAdapter } from './authenticated/edgex.adapter.js';
import { GrvtAdapter } from './authenticated/grvt.adapter.js';
import { JupiterAdapter } from './special/jupiter.adapter.js';

/**
 * Factory function to create all configured adapters
 */
export function createAllAdapters(): Map<ExchangeId, ExchangeAdapter> {
  const adapters = new Map<ExchangeId, ExchangeAdapter>();

  // Public adapters (always enabled)
  adapters.set('hyperliquid', new HyperliquidAdapter());
  adapters.set('dydx', new DydxV4Adapter());
  adapters.set('gmx', new GmxAdapter());
  adapters.set('paradex', new ParadexAdapter());
  adapters.set('myx', new MyxAdapter());

  // Authenticated adapters (enabled if configured)
  adapters.set('lighter', new LighterAdapter({
    apiKey: config.exchanges.lighter.apiKey,
  }));

  adapters.set('aster', new AsterAdapter({
    apiKey: config.exchanges.aster.apiKey,
    apiSecret: config.exchanges.aster.apiSecret,
  }));

  adapters.set('variational', new VariationalAdapter({
    apiKey: config.exchanges.variational.apiKey,
    apiSecret: config.exchanges.variational.apiSecret,
  }));

  adapters.set('edgex', new EdgeXAdapter({
    apiKey: config.exchanges.edgex.apiKey,
  }));

  adapters.set('grvt', new GrvtAdapter({
    apiKey: config.exchanges.grvt.apiKey,
  }));

  // Special adapters
  adapters.set('jupiter', new JupiterAdapter({
    rpcUrl: config.solana.rpcUrl,
  }));

  return adapters;
}

/**
 * Get list of configured (ready to use) exchange IDs
 */
export function getConfiguredExchangeIds(adapters: Map<ExchangeId, ExchangeAdapter>): ExchangeId[] {
  return Array.from(adapters.entries())
    .filter(([, adapter]) => adapter.isConfigured())
    .map(([id]) => id);
}
