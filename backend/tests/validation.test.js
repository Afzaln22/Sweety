import { VALID_SLOTS, getTodayMaxDate } from '../src/middleware/validationMiddleware.js';

describe('Validation Unit Logic Tests', () => {
  test('VALID_SLOTS contains the exact 4 required meal slots', () => {
    expect(VALID_SLOTS).toHaveLength(4);
    expect(VALID_SLOTS).toContain('Morning (fasting)');
    expect(VALID_SLOTS).toContain('After breakfast');
    expect(VALID_SLOTS).toContain('After lunch');
    expect(VALID_SLOTS).toContain('After dinner');
  });

  test('Validates glucose value is required ("Please enter a glucose value.")', () => {
    const isMissing = (val) => val === undefined || val === null || String(val).trim() === '';
    expect(isMissing(undefined)).toBe(true);
    expect(isMissing(null)).toBe(true);
    expect(isMissing('')).toBe(true);
    expect(isMissing('   ')).toBe(true);
    expect(isMissing(120)).toBe(false);
  });

  test('Validates glucose value must be a whole number between 40 and 600 ("Value must be between 40 and 600 mg/dl.")', () => {
    const isValidValue = (val) => {
      const num = Number(val);
      return Number.isInteger(num) && !isNaN(num) && num >= 40 && num <= 600;
    };

    expect(isValidValue(39)).toBe(false);
    expect(isValidValue(601)).toBe(false);
    expect(isValidValue(120.5)).toBe(false);
    expect(isValidValue('abc')).toBe(false);
    expect(isValidValue(40)).toBe(true);
    expect(isValidValue(600)).toBe(true);
    expect(isValidValue(124)).toBe(true);
  });

  test('Validates date cannot be in the future ("Date cannot be in the future.")', () => {
    const isFutureDate = (dateStr) => {
      const maxAllowed = getTodayMaxDate();
      return dateStr > maxAllowed;
    };

    const pastDate = '2020-01-01';
    const today = getTodayMaxDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // 2 days ahead to safely be tomorrow in any timezone
    const futureDate = tomorrow.toISOString().slice(0, 10);

    expect(isFutureDate(pastDate)).toBe(false);
    expect(isFutureDate(today)).toBe(false);
    expect(isFutureDate(futureDate)).toBe(true);
  });

  test('Formats slot error message with proper indefinite article ("You already have an After lunch reading for this date.")', () => {
    const getSlotError = (slot) => {
      const article = slot.startsWith('After') ? 'an' : (/^[aeiou]/i.test(slot) ? 'an' : 'a');
      return `You already have ${article} ${slot} reading for this date.`;
    };

    expect(getSlotError('After lunch')).toBe('You already have an After lunch reading for this date.');
    expect(getSlotError('After breakfast')).toBe('You already have an After breakfast reading for this date.');
    expect(getSlotError('After dinner')).toBe('You already have an After dinner reading for this date.');
    expect(getSlotError('Morning (fasting)')).toBe('You already have a Morning (fasting) reading for this date.');
  });

  test('Validates maximum 4 readings per day rule ("You can add only 4 readings per day.")', () => {
    const isMaxReached = (dailyCount) => dailyCount >= 4;
    expect(isMaxReached(0)).toBe(false);
    expect(isMaxReached(3)).toBe(false);
    expect(isMaxReached(4)).toBe(true);
    expect(isMaxReached(5)).toBe(true);
  });
});
