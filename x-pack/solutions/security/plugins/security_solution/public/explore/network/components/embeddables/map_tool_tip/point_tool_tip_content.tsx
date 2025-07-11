/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import type { ITooltipProperty } from '@kbn/maps-plugin/public/classes/tooltips/tooltip_property';
import { useIsExperimentalFeatureEnabled } from '../../../../../common/hooks/use_experimental_features';
import { sourceDestinationFieldMappings } from '../map_config';
import {
  getEmptyTagValue,
  getOrEmptyTagFromValue,
} from '../../../../../common/components/empty_value';
import { DescriptionListStyled } from '../../../../../common/components/page';
import { HostDetailsLink, NetworkDetailsLink } from '../../../../../common/components/links';
import { DefaultFieldRenderer } from '../../../../../timelines/components/field_renderers/default_renderer';
import type { FlowTarget } from '../../../../../../common/search_strategy';
import { SourcererScopeName } from '../../../../../sourcerer/store/model';

interface PointToolTipContentProps {
  contextId: string;
  featureProps: ITooltipProperty[];
}

export const PointToolTipContentComponent = ({
  contextId,
  featureProps,
}: PointToolTipContentProps) => {
  const newDataViewPickerEnabled = useIsExperimentalFeatureEnabled('newDataViewPickerEnabled');

  const featureDescriptionListItems = useMemo(
    () =>
      featureProps.map((featureProp) => {
        const key = featureProp.getPropertyKey();
        const value = featureProp.getRawValue() ?? [];

        return {
          title: sourceDestinationFieldMappings[key],
          description: (
            <>
              {value != null ? (
                <DefaultFieldRenderer
                  rowItems={Array.isArray(value) ? value : [value]}
                  attrName={key}
                  idPrefix={`map-point-tooltip-${contextId}-${key}-${value}`}
                  render={(item) => getRenderedFieldValue(key, item)}
                  scopeId={
                    newDataViewPickerEnabled
                      ? SourcererScopeName.explore
                      : SourcererScopeName.default
                  }
                />
              ) : (
                getEmptyTagValue()
              )}
            </>
          ),
        };
      }),
    [contextId, featureProps, newDataViewPickerEnabled]
  );

  return <DescriptionListStyled listItems={featureDescriptionListItems} />;
};

PointToolTipContentComponent.displayName = 'PointToolTipContentComponent';

export const PointToolTipContent = React.memo(PointToolTipContentComponent);

PointToolTipContent.displayName = 'PointToolTipContent';

export const getRenderedFieldValue = (field: string, value: string) => {
  if (value === '') {
    return getOrEmptyTagFromValue(value);
  } else if (['host.name'].includes(field)) {
    return <HostDetailsLink hostName={value} />;
  } else if (['source.ip', 'destination.ip'].includes(field)) {
    const flowTarget = field.split('.')[0] as FlowTarget;
    return <NetworkDetailsLink ip={value} flowTarget={flowTarget} />;
  }
  return <>{value}</>;
};
