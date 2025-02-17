/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { isDefined, combineSource } from './utils';

describe('isDefined', () => {
  it('returns true if value is defined', () => {
    expect(isDefined({ foo: 'bar' })).toEqual(true);
  });
  it('returns false if value is null', () => {
    expect(isDefined(null)).toEqual(false);
  });
  it('returns false if value is undefined', () => {
    expect(isDefined(undefined)).toEqual(false);
  });
});

describe('combineSource', () => {
  it('returns value when given a string', () => {
    expect(combineSource('foobar')).toEqual('foobar');
  });
  it('returns combined string from array', () => {
    expect(combineSource(['foo', 'bar', 'baz'])).toEqual('foobarbaz');
  });
  it('returns combined string from array with separator', () => {
    expect(combineSource(['foo', 'bar', 'baz'], '\n')).toEqual('foo\nbar\nbaz');
  });
});
