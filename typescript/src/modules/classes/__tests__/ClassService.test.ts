/// <reference types="jest" />

jest.mock('../../../shared/models', () => ({
  Class: { findOne: jest.fn() },
}));

jest.mock('../../../shared/config/logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

import { ClassService } from '../ClassService';
import { Class } from '../../../shared/models';

const mockClass = Class as jest.Mocked<typeof Class>;

describe('ClassService', () => {
  let service: ClassService;

  beforeEach(() => {
    service = new ClassService();
    jest.clearAllMocks();
  });

  it('updates the class name when the class exists', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    (mockClass.findOne as jest.Mock).mockResolvedValue({ update });

    await service.updateClassByClassCode('P1-1', 'P1 Integrity');

    expect(mockClass.findOne).toHaveBeenCalledWith({
      where: { code: 'P1-1' },
    });
    expect(update).toHaveBeenCalledWith({ name: 'P1 Integrity' });
  });

  it('throws a wrapped error when the class cannot be found', async () => {
    (mockClass.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.updateClassByClassCode('P1-1', 'P1 Integrity'),
    ).rejects.toThrow('Failed to update class with code P1-1');
  });

  it('throws a wrapped error when the update fails', async () => {
    const update = jest.fn().mockRejectedValue(new Error('DB error'));
    (mockClass.findOne as jest.Mock).mockResolvedValue({ update });

    await expect(
      service.updateClassByClassCode('P1-1', 'P1 Integrity'),
    ).rejects.toThrow('Failed to update class with code P1-1');
  });
});
