/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFormRow } from '@elastic/eui';
import { css } from '@emotion/react';
import { Query, TimeRange, fromKueryExpression, toElasticsearchQuery } from '@kbn/es-query';
import { observabilityAppId } from '@kbn/observability-shared-plugin/common';
import { kqlQuerySchema, kqlWithFiltersSchema } from '@kbn/slo-schema';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useKibana } from '../../../../hooks/use_kibana';
import { CreateSLOForm } from '../../types';
import { OptionalText } from './optional_text';
import type { SearchBarProps } from './query_builder';

type Props = SearchBarProps & {
  isFlyoutOpen?: boolean;
  range?: TimeRange;
  setRange?: (range: TimeRange) => void;
};

export function QuerySearchBar({
  name,
  label,
  dataView,
  required,
  tooltip,
  dataTestSubj,
  placeholder,
  isFlyoutOpen = false,
  range,
  setRange,
}: Props) {
  const {
    unifiedSearch: {
      ui: { SearchBar },
    },
    data: dataService,
  } = useKibana().services;

  const { control } = useFormContext<CreateSLOForm>();

  return (
    <Controller
      defaultValue=""
      name={name}
      control={control}
      rules={{
        required: Boolean(required) && Boolean(dataView),
        validate: (value) => {
          try {
            if (!dataView) return;
            if (typeof value === 'string') {
              const ast = fromKueryExpression(value);
              toElasticsearchQuery(ast, dataView);
            } else if (kqlWithFiltersSchema.is(value)) {
              const ast = fromKueryExpression(value.kqlQuery);
              toElasticsearchQuery(ast, dataView);
            }
          } catch (e) {
            return e.message;
          }
        },
      }}
      render={({ field, fieldState }) => {
        const handleQueryChange = (value?: Query, nRange?: TimeRange) => {
          if (isFlyoutOpen && nRange) {
            setRange?.(nRange);
          }

          if (kqlQuerySchema.is(field.value)) {
            field.onChange(String(value?.query));
          } else {
            field.onChange({
              filters: field.value?.filters ?? [],
              kqlQuery: String(value?.query),
            });
          }
        };
        return (
          <EuiFormRow
            label={
              !!tooltip ? (
                <span>
                  {label} {tooltip}
                </span>
              ) : (
                label
              )
            }
            labelAppend={!required ? <OptionalText /> : undefined}
            isInvalid={fieldState.invalid}
            error={fieldState.error?.message}
            fullWidth
          >
            <div
              css={css`
                .uniSearchBar {
                  padding: 0;
                }
              `}
            >
              <SearchBar
                appName={observabilityAppId}
                dataTestSubj={dataTestSubj}
                indexPatterns={dataView ? [dataView] : []}
                isDisabled={!dataView}
                placeholder={placeholder}
                query={{
                  query: kqlQuerySchema.is(field.value)
                    ? String(field.value)
                    : field.value.kqlQuery,
                  language: 'kuery',
                }}
                // we rely on submit button to submit the form when the flyout is open
                onQueryChange={
                  isFlyoutOpen
                    ? undefined
                    : (value) => handleQueryChange(value.query, value.dateRange)
                }
                onQuerySubmit={(value) => handleQueryChange(value.query, value.dateRange)}
                onFiltersUpdated={(filters) => {
                  const updatedFilters = filters.map((filter) => {
                    const { $state, meta, ...rest } = filter;
                    const query = filter?.query ? { ...filter.query } : { ...rest };
                    return {
                      meta: {
                        ...meta,
                        alias: meta?.alias ?? JSON.stringify(query),
                      },
                      query,
                    };
                  });

                  dataService.query.filterManager.setFilters(updatedFilters);

                  if (kqlQuerySchema.is(field.value)) {
                    field.onChange({
                      filters: updatedFilters,
                      kqlQuery: field.value,
                    });
                  } else {
                    field.onChange({
                      kqlQuery: field.value?.kqlQuery ?? '',
                      filters: updatedFilters,
                    });
                  }
                }}
                onSavedQueryUpdated={(savedQuery) => {
                  field.onChange({
                    filters: savedQuery.attributes.filters,
                    kqlQuery: String(savedQuery.attributes.query.query),
                  });
                }}
                dateRangeFrom={range?.from ?? 'now-15m'}
                dateRangeTo={range?.to ?? 'now'}
                onTimeRangeChange={(nRange) => {
                  setRange?.(nRange.dateRange);
                }}
                showDatePicker={isFlyoutOpen}
                showSubmitButton={isFlyoutOpen}
                showQueryInput={true}
                disableQueryLanguageSwitcher={true}
                onClearSavedQuery={() => {}}
                filters={kqlQuerySchema.is(field.value) ? [] : field.value?.filters ?? []}
                allowSavingQueries={true}
                showSavedQueryControls={true}
              />
            </div>
          </EuiFormRow>
        );
      }}
    />
  );
}
