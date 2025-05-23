/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { estypes } from '@elastic/elasticsearch';
import { ElasticsearchClient, IUiSettingsClient } from '@kbn/core/server';
import { keyBy } from 'lodash';
import { defer, from } from 'rxjs';
import { rateLimitingForkJoin } from '../../common/data_views/utils';
import type { QueryDslQueryContainer } from '../../common/types';

import {
  getFieldCapabilities,
  getCapabilitiesForRollupIndices,
  mergeCapabilitiesWithFields,
} from './lib';
import { DataViewType } from '../../common/types';

export interface FieldDescriptor {
  aggregatable: boolean;
  name: string;
  readFromDocValues: boolean;
  searchable: boolean;
  type: string;
  esTypes: string[];
  subType?: FieldSubType;
  metadata_field?: boolean;
  fixedInterval?: string[];
  timeZone?: string[];
  timeSeriesMetric?: estypes.MappingTimeSeriesMetricType;
  timeSeriesDimension?: boolean;
  defaultFormatter?: string;
}

interface FieldSubType {
  multi?: { parent: string };
  nested?: { path: string };
}

interface IndexPatternsFetcherOptionalParams {
  uiSettingsClient: IUiSettingsClient;
  allowNoIndices?: boolean;
  rollupsEnabled?: boolean;
}

export class IndexPatternsFetcher {
  private readonly uiSettingsClient?: IUiSettingsClient;
  private readonly allowNoIndices: boolean;
  private readonly rollupsEnabled: boolean;

  constructor(
    private readonly elasticsearchClient: ElasticsearchClient,
    optionalParams?: IndexPatternsFetcherOptionalParams
  ) {
    this.uiSettingsClient = optionalParams?.uiSettingsClient;
    this.allowNoIndices = optionalParams?.allowNoIndices || false;
    this.rollupsEnabled = optionalParams?.rollupsEnabled || false;
  }

  /**
   *  Get a list of field objects for an index pattern that may contain wildcards
   *
   *  @param {Object} [options]
   *  @property {String} options.pattern The index pattern
   *  @property {Number} options.metaFields The list of underscore prefixed fields that should
   *                                        be left in the field list (all others are removed).
   *  @return {Promise<Array<Fields>>}
   */
  async getFieldsForWildcard(options: {
    pattern: string | string[];
    metaFields?: string[];
    fieldCapsOptions?: { allow_no_indices: boolean; includeUnmapped?: boolean };
    type?: string;
    rollupIndex?: string;
    indexFilter?: QueryDslQueryContainer;
    fields?: string[];
    allowHidden?: boolean;
    fieldTypes?: string[];
    includeEmptyFields?: boolean;
    abortSignal?: AbortSignal;
    runtimeMappings?: estypes.MappingRuntimeFields;
  }): Promise<{ fields: FieldDescriptor[]; indices: string[] }> {
    const {
      pattern,
      metaFields = [],
      fieldCapsOptions,
      type,
      rollupIndex,
      indexFilter,
      allowHidden,
      fieldTypes,
      includeEmptyFields,
      abortSignal,
      runtimeMappings,
    } = options;
    const allowNoIndices = fieldCapsOptions?.allow_no_indices || this.allowNoIndices;

    const expandWildcards = allowHidden ? 'all' : 'open';

    const fieldCapsResponse = await getFieldCapabilities({
      callCluster: this.elasticsearchClient,
      uiSettingsClient: this.uiSettingsClient,
      indices: pattern,
      metaFields,
      fieldCapsOptions: {
        allow_no_indices: allowNoIndices,
        include_unmapped: fieldCapsOptions?.includeUnmapped,
      },
      indexFilter,
      fields: options.fields || ['*'],
      expandWildcards,
      fieldTypes,
      includeEmptyFields,
      runtimeMappings,
      abortSignal,
    });

    if (this.rollupsEnabled && type === DataViewType.ROLLUP && rollupIndex) {
      const rollupFields: FieldDescriptor[] = [];
      const capabilities = getCapabilitiesForRollupIndices(
        await this.elasticsearchClient.rollup.getRollupIndexCaps({
          index: rollupIndex,
        })
      );

      const capabilityCheck =
        // use the rollup index name BUT if its an alias, we'll take the first one
        capabilities[rollupIndex] || capabilities[Object.keys(capabilities)[0]];

      if (capabilityCheck.error) {
        throw new Error(capabilityCheck.error);
      }

      const rollupIndexCapabilities = capabilityCheck.aggs;
      const fieldCapsResponseObj = keyBy(fieldCapsResponse.fields, 'name');
      // Keep meta fields
      metaFields!.forEach(
        (field: string) =>
          fieldCapsResponseObj[field] && rollupFields.push(fieldCapsResponseObj[field])
      );
      return {
        fields: mergeCapabilitiesWithFields(
          rollupIndexCapabilities!,
          fieldCapsResponseObj,
          rollupFields
        ),
        indices: fieldCapsResponse.indices,
      };
    }
    return fieldCapsResponse;
  }

  /**
   * Get existing index pattern list by providing string array index pattern list.
   * @param indices - index pattern list
   * @returns index pattern list of index patterns that match indices
   */
  async getExistingIndices(indices: string[]): Promise<string[]> {
    const indicesObs = indices.map((pattern) => {
      // when checking a negative pattern, check if the positive pattern exists
      const indexToQuery = pattern.trim().startsWith('-')
        ? pattern.trim().substring(1)
        : pattern.trim();
      return defer(() =>
        from(
          this.getFieldsForWildcard({
            // check one field to keep request fast/small
            fields: ['_id'],
            pattern: indexToQuery,
          })
        )
      );
    });

    return new Promise<boolean[]>((resolve) => {
      rateLimitingForkJoin(indicesObs, 3, { fields: [], indices: [] }).subscribe((value) => {
        resolve(value.map((v) => v.indices.length > 0));
      });
    })
      .then((allPatterns: boolean[]) =>
        indices.filter((pattern, i, self) => self.indexOf(pattern) === i && allPatterns[i])
      )
      .catch(() => indices);
  }
}
