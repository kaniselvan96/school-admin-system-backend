/// <reference types="jest" />

import Express from 'express';

jest.mock('formidable', () => ({
  IncomingForm: jest.fn(),
}));

import request from 'supertest';

const mockUpdateClassByClassCode = jest.fn<Promise<void>, [string, string]>();

jest.mock('../../../shared/config/logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

jest.mock('../ClassService', () => ({
  ClassService: jest.fn().mockImplementation(() => ({
    updateClassByClassCode: (classCode: string, className: string) =>
      mockUpdateClassByClassCode(classCode, className),
  })),
}));

import ClassController from '../ClassController';

describe('ClassController', () => {
  const createApp = () => {
    const app = Express();
    app.use(Express.json());
    app.use('/', ClassController);
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateClassByClassCode.mockResolvedValue(undefined);
  });

  it('should update the class and return 204', async () => {
    const app = createApp();

    const res = await request(app)
      .put('/class/P1-1')
      .send({ className: 'P1 Integrity' });

    expect(res.status).toBe(204);
    expect(mockUpdateClassByClassCode).toHaveBeenCalledWith(
      'P1-1',
      'P1 Integrity',
    );
  });

  it('should return 400 when the request body is invalid', async () => {
    const app = createApp();

    const res = await request(app).put('/class/P1-1').send({ className: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(mockUpdateClassByClassCode).not.toHaveBeenCalled();
  });

  it('should return 500 when the service throws', async () => {
    const app = createApp();
    mockUpdateClassByClassCode.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .put('/class/P1-1')
      .send({ className: 'P1 Integrity' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to update class data' });
  });
});
