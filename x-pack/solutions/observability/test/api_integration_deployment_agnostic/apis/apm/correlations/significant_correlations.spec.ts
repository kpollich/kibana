/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import type { DeploymentAgnosticFtrProviderContext } from '../../../ftr_provider_context';
import { ARCHIVER_ROUTES } from '../constants/archiver';

export default function ApiTest({ getService }: DeploymentAgnosticFtrProviderContext) {
  const apmApiClient = getService('apmApi');
  const esArchiver = getService('esArchiver');

  const endpoint = 'POST /internal/apm/correlations/significant_correlations/transactions';

  const getOptions = () => ({
    params: {
      body: {
        environment: 'ENVIRONMENT_ALL',
        start: '2020',
        end: '2021',
        kuery: '',
        fieldValuePairs: [
          { fieldName: 'service.version', fieldValue: '2020-08-26 02:09:20' },
          { fieldName: 'service.version', fieldValue: 'None' },
          {
            fieldName: 'service.node.name',
            fieldValue: 'af586da824b28435f3a8c8f0c016096502cd2495d64fb332db23312be88cfff6',
          },
          {
            fieldName: 'service.node.name',
            fieldValue: 'asdf',
          },
          { fieldName: 'service.runtime.version', fieldValue: '12.18.3' },
          { fieldName: 'service.runtime.version', fieldValue: '2.6.6' },
          {
            fieldName: 'kubernetes.pod.name',
            fieldValue: 'opbeans-node-6cf6cf6f58-r5q9l',
          },
          {
            fieldName: 'kubernetes.pod.name',
            fieldValue: 'opbeans-java-6dc7465984-h9sh5',
          },
          {
            fieldName: 'kubernetes.pod.uid',
            fieldValue: '8da9c944-e741-11ea-819e-42010a84004a',
          },
          {
            fieldName: 'kubernetes.pod.uid',
            fieldValue: '8e192c6c-e741-11ea-819e-42010a84004a',
          },
          {
            fieldName: 'container.id',
            fieldValue: 'af586da824b28435f3a8c8f0c016096502cd2495d64fb332db23312be88cfff6',
          },
          {
            fieldName: 'container.id',
            fieldValue: 'asdf',
          },
          { fieldName: 'host.ip', fieldValue: '10.52.6.48' },
          { fieldName: 'host.ip', fieldValue: '10.52.6.50' },
        ],
      },
    },
  });

  describe('significant correlations', () => {
    describe('without data', () => {
      it('handles the empty state', async () => {
        const response = await apmApiClient.readUser({
          endpoint,
          ...getOptions(),
        });

        expect(response.status).to.be(200);
        expect(response.body?.latencyCorrelations.length).to.be(0);
      });
    });

    describe('with data and default args', () => {
      before(async () => {
        await esArchiver.load(ARCHIVER_ROUTES['8.0.0']);
      });
      after(async () => {
        await esArchiver.unload(ARCHIVER_ROUTES['8.0.0']);
      });

      it('returns significant correlations', async () => {
        const response = await apmApiClient.readUser({
          endpoint,
          ...getOptions(),
        });

        expect(response.status).to.eql(200);
        expect(response.body?.latencyCorrelations.length).to.be(7);
      });
    });
  });
}
