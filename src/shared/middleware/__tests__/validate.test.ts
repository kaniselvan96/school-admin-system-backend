/// <reference types="jest" />

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import validate from '../validate';

type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
  body?: Record<string, unknown>;
};

const createResponse = (): MockResponse => {
  const res: MockResponse = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockImplementation(() => res);
  res.json.mockImplementation((body: Record<string, unknown>) => {
    res.body = body;
    return res;
  });

  return res;
};

describe('validate middleware', () => {
  it('parses valid params, body and query and calls next', () => {
    const middleware = validate({
      params: z.object({ id: z.string().min(1) }),
      body: z.object({ name: z.string().min(1) }),
      query: z.object({
        limit: z
          .string()
          .transform((value) => parseInt(value, 10))
          .refine((value) => value > 0),
      }),
    });
    const req = {
      params: { id: '123' },
      body: { name: 'Alice' },
      query: { limit: '10' },
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn() as unknown as NextFunction;

    middleware(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.params).toEqual({ id: '123' });
    expect(req.body).toEqual({ name: 'Alice' });
    expect(req.query).toEqual({ limit: 10 });
  });

  it('returns 400 with aggregated errors when validation fails', () => {
    const middleware = validate({
      params: z.object({ id: z.string().min(1, 'id is required') }),
      body: z.object({ name: z.string().min(1, 'name is required') }),
      query: z.object({
        limit: z
          .string()
          .transform((value) => parseInt(value, 10))
          .refine((value) => value > 0, 'limit must be positive'),
      }),
    });
    const req = {
      params: { id: '' },
      body: { name: '' },
      query: { limit: '0' },
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn() as unknown as NextFunction;

    middleware(req, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      error: 'Validation failed',
      details: [
        'params.id: id is required',
        'body.name: name is required',
        'query.limit: limit must be positive',
      ],
    });
  });
});
