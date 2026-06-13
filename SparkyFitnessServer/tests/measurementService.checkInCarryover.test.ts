import { vi, beforeEach, describe, expect, it } from 'vitest';
import measurementService from '../services/measurementService.js';
import measurementRepository from '../models/measurementRepository.js';

vi.mock('../models/measurementRepository');

describe('Measurement Service - Check-In Carryover', () => {
  const userId = 'user-123';
  const date = '2026-06-12';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return today's measurements as-is when all fields are present", async () => {
    const todayRow = {
      id: '1',
      user_id: userId,
      entry_date: date,
      weight: 80,
      height: 180,
      waist: 85,
      neck: 38,
      hips: 95,
      body_fat_percentage: 18,
      steps: 5000,
    };
    // @ts-expect-error mock
    measurementRepository.getCheckInMeasurementsByDate.mockResolvedValue(
      todayRow
    );

    const result = await measurementService.getCheckInMeasurements(
      userId,
      userId,
      date
    );

    expect(result).toEqual(todayRow);
    expect(
      measurementRepository.getLatestCheckInMeasurementsOnOrBeforeDate
    ).not.toHaveBeenCalled();
  });

  it('should carry over null fields from the most recent previous entry', async () => {
    const todayRow = {
      id: '2',
      user_id: userId,
      entry_date: date,
      weight: null,
      height: null,
      waist: null,
      neck: null,
      hips: null,
      body_fat_percentage: null,
      steps: 8000,
    };
    const previousRow = {
      id: '1',
      user_id: userId,
      entry_date: '2026-06-10',
      weight: 79,
      height: 180,
      waist: 84,
      neck: 37.5,
      hips: 94,
      body_fat_percentage: 17.5,
      steps: 6000,
    };
    // @ts-expect-error mock
    measurementRepository.getCheckInMeasurementsByDate.mockResolvedValue(
      todayRow
    );
    // @ts-expect-error mock
    measurementRepository.getLatestCheckInMeasurementsOnOrBeforeDate.mockResolvedValue(
      previousRow
    );

    const result = await measurementService.getCheckInMeasurements(
      userId,
      userId,
      date
    );

    expect(result.weight).toBe(79);
    expect(result.height).toBe(180);
    expect(result.waist).toBe(84);
    expect(result.neck).toBe(37.5);
    expect(result.hips).toBe(94);
    expect(result.body_fat_percentage).toBe(17.5);
    expect(result.steps).toBe(8000);
  });

  it('should only fill null fields and preserve existing values', async () => {
    const todayRow = {
      id: '3',
      user_id: userId,
      entry_date: date,
      weight: 81,
      height: null,
      waist: 86,
      neck: null,
      hips: null,
      body_fat_percentage: null,
      steps: null,
    };
    const previousRow = {
      id: '1',
      user_id: userId,
      entry_date: '2026-06-11',
      weight: 79,
      height: 180,
      waist: 84,
      neck: 37.5,
      hips: 94,
      body_fat_percentage: 17.5,
      steps: 6000,
    };
    // @ts-expect-error mock
    measurementRepository.getCheckInMeasurementsByDate.mockResolvedValue(
      todayRow
    );
    // @ts-expect-error mock
    measurementRepository.getLatestCheckInMeasurementsOnOrBeforeDate.mockResolvedValue(
      previousRow
    );

    const result = await measurementService.getCheckInMeasurements(
      userId,
      userId,
      date
    );

    expect(result.weight).toBe(81);
    expect(result.waist).toBe(86);
    expect(result.height).toBe(180);
    expect(result.neck).toBe(37.5);
    expect(result.hips).toBe(94);
    expect(result.body_fat_percentage).toBe(17.5);
    expect(result.steps).toBeNull();
  });

  it('should not carry over when there is no previous entry', async () => {
    const todayRow = {
      id: '4',
      user_id: userId,
      entry_date: date,
      weight: null,
      height: null,
      waist: null,
      neck: null,
      hips: null,
      body_fat_percentage: null,
      steps: null,
    };
    // @ts-expect-error mock
    measurementRepository.getCheckInMeasurementsByDate.mockResolvedValue(
      todayRow
    );
    // @ts-expect-error mock
    measurementRepository.getLatestCheckInMeasurementsOnOrBeforeDate.mockResolvedValue(
      null
    );

    const result = await measurementService.getCheckInMeasurements(
      userId,
      userId,
      date
    );

    expect(result.weight).toBeNull();
    expect(result.height).toBeNull();
  });

  it('should not carry over when the previous entry is the same date', async () => {
    const todayRow = {
      id: '5',
      user_id: userId,
      entry_date: date,
      weight: null,
      height: null,
      waist: null,
      neck: null,
      hips: null,
      body_fat_percentage: null,
      steps: null,
    };
    const sameDay = {
      id: '5',
      user_id: userId,
      entry_date: date,
      weight: null,
      height: null,
      waist: null,
      neck: null,
      hips: null,
      body_fat_percentage: null,
      steps: null,
    };
    // @ts-expect-error mock
    measurementRepository.getCheckInMeasurementsByDate.mockResolvedValue(
      todayRow
    );
    // @ts-expect-error mock
    measurementRepository.getLatestCheckInMeasurementsOnOrBeforeDate.mockResolvedValue(
      sameDay
    );

    const result = await measurementService.getCheckInMeasurements(
      userId,
      userId,
      date
    );

    expect(result.weight).toBeNull();
    expect(result.height).toBeNull();
  });

  it('should return empty object when no entry exists for today', async () => {
    // @ts-expect-error mock
    measurementRepository.getCheckInMeasurementsByDate.mockResolvedValue(null);

    const result = await measurementService.getCheckInMeasurements(
      userId,
      userId,
      date
    );

    expect(result).toEqual({});
    expect(
      measurementRepository.getLatestCheckInMeasurementsOnOrBeforeDate
    ).not.toHaveBeenCalled();
  });
});
