/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import React from 'react';
import styled from '@emotion/styled';

export const MlUnavailablePrompt: React.FunctionComponent<{}> = () => (
  <EmptyPrompt
    title={
      <h2>
        <FormattedMessage
          id="xpack.infra.logs.analysis.mlUnavailableTitle"
          defaultMessage="This feature requires Machine Learning"
        />
      </h2>
    }
    body={
      <p>
        <FormattedMessage
          id="xpack.infra.logs.analysis.mlUnavailableBody"
          defaultMessage="Check the {machineLearningAppLink} for more information."
          values={{
            machineLearningAppLink: (
              <EuiLink
                data-test-subj="infraMlUnavailablePromptMachineLearningAppLink"
                href="ml"
                target="_blank"
              >
                <FormattedMessage
                  id="xpack.infra.logs.analysisPage.unavailable.mlAppLink"
                  defaultMessage="Machine Learning app"
                />
              </EuiLink>
            ),
          }}
        />
      </p>
    }
    actions={
      <EuiButton
        data-test-subj="infraMlUnavailablePromptOpenMachineLearningButton"
        target="_blank"
        href="ml"
        color="primary"
        fill
      >
        {i18n.translate('xpack.infra.logs.analysis.mlAppButton', {
          defaultMessage: 'Open Machine Learning',
        })}
      </EuiButton>
    }
  />
);

const EmptyPrompt = styled(EuiEmptyPrompt)`
  align-self: center;
`;
