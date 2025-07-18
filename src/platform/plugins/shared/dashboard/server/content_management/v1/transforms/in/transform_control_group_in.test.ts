/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ControlsGroupState } from '@kbn/controls-schemas';
import { transformControlGroupIn } from './transform_control_group_in';
import { CONTROL_WIDTH_SMALL } from '@kbn/controls-constants';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('transformControlGroupIn', () => {
  const mockControlsGroupState: ControlsGroupState = {
    chainingSystem: 'NONE',
    labelPosition: 'oneLine',
    autoApplySelections: true,
    ignoreParentSettings: {
      ignoreFilters: true,
      ignoreQuery: true,
      ignoreTimerange: true,
      ignoreValidations: true,
    },
    controls: [
      {
        id: 'control1',
        type: 'type1',
        width: CONTROL_WIDTH_SMALL,
        controlConfig: { bizz: 'buzz' },
        order: 0,
        grow: false,
      },
      {
        type: 'type2',
        grow: true,
        width: CONTROL_WIDTH_SMALL,
        controlConfig: { boo: 'bear' },
        order: 1,
      },
    ],
  };

  it('should return undefined if controlsGroupState is undefined', () => {
    const result = transformControlGroupIn(undefined);
    expect(result).toBeUndefined();
  });

  it('should transform controlsGroupState correctly', () => {
    const result = transformControlGroupIn(mockControlsGroupState);

    expect(result).toEqual({
      chainingSystem: 'NONE',
      controlStyle: 'oneLine',
      showApplySelections: false,
      ignoreParentSettingsJSON: JSON.stringify({
        ignoreFilters: true,
        ignoreQuery: true,
        ignoreTimerange: true,
        ignoreValidations: true,
      }),
      panelsJSON: JSON.stringify({
        control1: {
          type: 'type1',
          width: 'small',
          order: 0,
          grow: false,
          explicitInput: { bizz: 'buzz' },
        },
        'mock-uuid': {
          type: 'type2',
          grow: true,
          width: 'small',
          order: 1,
          explicitInput: { boo: 'bear' },
        },
      }),
    });
  });

  it('should handle empty controls array', () => {
    const controlsGroupState: ControlsGroupState = {
      ...mockControlsGroupState,
      controls: [],
    };

    const result = transformControlGroupIn(controlsGroupState);

    expect(result).toEqual({
      chainingSystem: 'NONE',
      controlStyle: 'oneLine',
      showApplySelections: false,
      ignoreParentSettingsJSON: JSON.stringify({
        ignoreFilters: true,
        ignoreQuery: true,
        ignoreTimerange: true,
        ignoreValidations: true,
      }),
      panelsJSON: JSON.stringify({}),
    });
  });
});
