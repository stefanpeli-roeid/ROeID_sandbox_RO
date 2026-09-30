/**
 * Credo Agent Setup
 * Provides a singleton Credo agent instance for mdoc operations
 */

import {
  Agent,
  InitConfig,
  LogLevel,
  ConsoleLogger,
  Kms
} from '@credo-ts/core';
import {
  agentDependencies,
  NodeKeyManagementService,
  NodeInMemoryKeyManagementStorage
} from '@credo-ts/node';
import { InMemoryStorageModule } from './InMemoryStorageModule.js';

let agentInstance: Agent | null = null;

/**
 * Initialize and return singleton Credo agent
 */
export async function getCredoAgent(): Promise<Agent> {
  if (agentInstance) {
    return agentInstance;
  }

  const config: InitConfig = {
    logger: new ConsoleLogger(LogLevel.error), // Minimal logging
    // Our StorageService starts empty each process, so there's no StorageVersionRecord yet;
    // let Credo write a fresh one instead of aborting on a perceived stale-version mismatch.
    autoUpdateStorageOnStartup: true,
  };

  const agent = new Agent({
    config,
    dependencies: agentDependencies,
    modules: {
      // Software-only KMS backend (no native bindings) so agent.kms.importKey/sign work
      // for mdoc issuer/device signing.
      kms: new Kms.KeyManagementModule({
        backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
      }),
      // Credo's Agent constructor requires a StorageService to be registered even though
      // we never persist records across requests (MdocRecord.fromMdoc is used in-memory).
      storage: new InMemoryStorageModule(),
    },
  });

  await agent.initialize();
  agentInstance = agent;

  return agent;
}

/**
 * Shutdown the Credo agent
 */
export async function shutdownCredoAgent(): Promise<void> {
  if (agentInstance) {
    await agentInstance.shutdown();
    agentInstance = null;
  }
}
