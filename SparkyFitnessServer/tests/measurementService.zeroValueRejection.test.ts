import { beforeEach, describe, expect, it, vi } from 'vitest';
import measurementRepository from '../models/measurementRepository.js';
import measurementService from '../services/measurementService.js';
import { loadUserTimezone } from '../utils/timezoneLoader.js';

vi.mock('../utils/timezoneLoader.js', () => ({
  loadUserTimezone: vi.fn(),
}));
vi.mock('../models/measurementRepository');
vi.mock('../models/userRepository');
vi.mock('../models/exerciseRepository');
vi.mock('../models/exerciseEntry');
vi.mock('../models/sleepRepository');
vi.mock('../models/waterContainerRepository');
vi.mock('../models/activityDetailsRepository');

describe('processHealthData - zero value rejection for body measurements', () => {
  const userId = 'user-123';
  const actingUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadUserTimezone).mockResolvedValue('UTC');
    measurementRepository.upsertCheckInMeasurements = vi
      .fn()
      .mockResolvedValue({ id: '1' });
  });

  it('rejects weight = 0', async () => {
    await expect(
      measurementService.processHealthData(
        [{ type: 'weight', value: '0', date: '2026-06-13', source: 'garmin' }],
        userId,
        actingUserId
      )
    ).rejects.toThrow();
    expect(
      measurementRepository.upsertCheckInMeasurements
    ).not.toHaveBeenCalled();
  });

  it('accepts weight > 0', async () => {
    const result = await measurementService.processHealthData(
      [{ type: 'weight', value: '80.5', date: '2026-06-13', source: 'garmin' }],
      userId,
      actingUserId
    );
    expect(result.processed.length).toBe(1);
    expect(
      measurementRepository.upsertCheckInMeasurements
    ).toHaveBeenCalledWith(userId, actingUserId, '2026-06-13', {
      weight: 80.5,
    });
  });

  it('rejects body_fat_percentage = 0', async () => {
    await expect(
      measurementService.processHealthData(
        [
          {
            type: 'body_fat_percentage',
            value: '0',
            date: '2026-06-13',
            source: 'garmin',
          },
        ],
        userId,
        actingUserId
      )
    ).rejects.toThrow();
    expect(
      measurementRepository.upsertCheckInMeasurements
    ).not.toHaveBeenCalled();
  });

  it('accepts body_fat_percentage > 0', async () => {
    const result = await measurementService.processHealthData(
      [
        {
          type: 'body_fat_percentage',
          value: '18.5',
          date: '2026-06-13',
          source: 'garmin',
        },
      ],
      userId,
      actingUserId
    );
    expect(result.processed.length).toBe(1);
    expect(
      measurementRepository.upsertCheckInMeasurements
    ).toHaveBeenCalledWith(userId, actingUserId, '2026-06-13', {
      body_fat_percentage: 18.5,
    });
  });

  it('rejects body_fat_percentage > 100', async () => {
    await expect(
      measurementService.processHealthData(
        [
          {
            type: 'body_fat_percentage',
            value: '101',
            date: '2026-06-13',
            source: 'garmin',
          },
        ],
        userId,
        actingUserId
      )
    ).rejects.toThrow();
    expect(
      measurementRepository.upsertCheckInMeasurements
    ).not.toHaveBeenCalled();
  });

  it('rejects height = 0 (via normalizeHeightForCheckIn)', async () => {
    await expect(
      measurementService.processHealthData(
        [
          {
            type: 'height',
            value: '0',
            unit: 'cm',
            date: '2026-06-13',
            source: 'garmin',
          },
        ],
        userId,
        actingUserId
      )
    ).rejects.toThrow();
    expect(
      measurementRepository.upsertCheckInMeasurements
    ).not.toHaveBeenCalled();
  });
});
