/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import {
  RequestHandlerContext,
  KibanaRequest,
  KibanaResponseFactory,
  IKibanaResponse,
  IRouter,
  CoreSetup,
} from '@kbn/core/server';
import { range, chunk } from 'lodash';
import { TaskManagerStartContract, ConcreteTaskInstance } from '@kbn/task-manager-plugin/server';
import { PerfApi, PerfResult } from './types';

const scope = 'perf-testing';

export function initRoutes(
  router: IRouter,
  core: CoreSetup,
  taskManagerStart: Promise<TaskManagerStartContract>,
  performanceApi: PerfApi
) {
  router.post(
    {
      path: '/api/perf_tasks',
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      validate: {
        body: schema.object({
          tasksToSpawn: schema.number(),
          durationInSeconds: schema.number(),
          trackExecutionTimeline: schema.boolean({ defaultValue: false }),
        }),
      },
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      performanceApi.capture();

      const taskManager = await taskManagerStart;

      const { tasksToSpawn, durationInSeconds, trackExecutionTimeline } = req.body;
      const startAt = millisecondsFromNow(5000).getTime();
      await chunk(range(tasksToSpawn), 200)
        .map(
          (chunkOfTasksToSpawn) => () =>
            Promise.all(
              chunkOfTasksToSpawn.map(async (taskIndex) =>
                taskManager.schedule(
                  {
                    taskType: 'performanceTestTask',
                    params: {
                      startAt,
                      taskIndex,
                      trackExecutionTimeline,
                      runUntil: millisecondsFromNow(durationInSeconds * 1000).getTime(),
                    },
                    state: {},
                    scope: [scope],
                  },
                  { request: req }
                )
              )
            )
        )
        .reduce((chain, nextExecutor) => {
          return chain.then(() => nextExecutor());
        }, Promise.resolve<ConcreteTaskInstance[] | undefined>(undefined));

      return res.ok({
        body: await new Promise<PerfResult>((resolve, reject) => {
          setTimeout(() => {
            performanceApi.endCapture().then((perf) => resolve(perf), reject);
          }, durationInSeconds * 1000 + 10000 /* wait extra 10s to drain queue */);
        }),
      });
    }
  );
}

function millisecondsFromNow(ms: number): Date {
  const dt = new Date();
  dt.setTime(dt.getTime() + ms);
  return dt;
}
