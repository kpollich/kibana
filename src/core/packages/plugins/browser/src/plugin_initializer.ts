/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { PluginOpaqueId } from '@kbn/core-base-common';
import type { LoggerFactory } from '@kbn/logging';
import type { PackageInfo, EnvironmentMode } from '@kbn/config';
import type { Plugin } from './plugin';

/**
 * The `plugin` export at the root of a plugin's `public` directory should conform
 * to this interface.
 *
 * @public
 */
export type PluginInitializer<
  TSetup = void,
  TStart = void,
  TPluginsSetup extends Record<string, any> = never,
  TPluginsStart extends Record<string, any> = never
> = (core: PluginInitializerContext) => Plugin<TSetup, TStart, TPluginsSetup, TPluginsStart>;

/**
 * The available core services passed to a `PluginInitializer`
 *
 * @public
 */
export interface PluginInitializerContext<ConfigSchema extends object = object> {
  /**
   * A symbol used to identify this plugin in the system. Needed when registering handlers or context providers.
   */
  readonly opaqueId: PluginOpaqueId;
  readonly env: {
    mode: Readonly<EnvironmentMode>;
    packageInfo: Readonly<PackageInfo>;
  };
  readonly logger: LoggerFactory;
  readonly config: {
    get: <T extends object = ConfigSchema>() => T;
  };
}
