/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { EuiDelayRender, EuiSkeletonText } from '@elastic/eui';
import type { FieldFormat, FieldFormatParams } from '@kbn/field-formats-plugin/common';
import { memoize } from 'lodash';
import React, { LazyExoticComponent, PureComponent } from 'react';
import { FormatEditorServiceStart } from '../../service';
import { FieldFormatEditor, FieldFormatEditorFactory } from './editors';

export interface FormatEditorProps {
  fieldType: string;
  fieldFormat: FieldFormat;
  fieldFormatId: string;
  fieldFormatParams: FieldFormatParams;
  fieldFormatEditors: FormatEditorServiceStart['fieldFormatEditors'];
  onChange: (change: FieldFormatParams) => void;
  onError: (error?: string) => void;
}

export interface FormatEditorState {
  EditorComponent: LazyExoticComponent<FieldFormatEditor> | null;
  fieldFormatId?: string;
}

// use memoize to get stable reference
const unwrapEditor = memoize(
  (editorFactory: FieldFormatEditorFactory | null): FormatEditorState['EditorComponent'] => {
    if (!editorFactory) return null;
    return React.lazy(() => editorFactory().then((editor) => ({ default: editor })));
  }
);

export class FormatEditor extends PureComponent<FormatEditorProps, FormatEditorState> {
  constructor(props: FormatEditorProps) {
    super(props);
    this.state = {
      EditorComponent: unwrapEditor(props.fieldFormatEditors.getById(props.fieldFormatId) ?? null),
    };
  }

  static getDerivedStateFromProps(nextProps: FormatEditorProps) {
    return {
      EditorComponent: unwrapEditor(
        nextProps.fieldFormatEditors.getById(nextProps.fieldFormatId) ?? null
      ),
    };
  }

  render() {
    const { EditorComponent } = this.state;
    const { fieldType, fieldFormat, fieldFormatParams, onChange, onError } = this.props;

    return (
      <>
        {EditorComponent ? (
          <React.Suspense
            fallback={
              // We specify minHeight to avoid too mitigate layout shifts while loading an editor
              // ~430 corresponds to "4 lines" of EuiSkeletonText
              <div css={{ minHeight: 430, marginTop: 8 }}>
                <EuiDelayRender>
                  <EuiSkeletonText lines={4} />
                </EuiDelayRender>
              </div>
            }
          >
            <EditorComponent
              fieldType={fieldType}
              format={fieldFormat}
              formatParams={fieldFormatParams}
              onChange={onChange}
              onError={onError}
            />
          </React.Suspense>
        ) : null}
      </>
    );
  }
}
