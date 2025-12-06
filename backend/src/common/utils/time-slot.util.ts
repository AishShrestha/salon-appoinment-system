import { BadRequestException } from '@nestjs/common';

/**
 * Time slot utility functions for booking system
 * Follows KISS principle - simple, easy-to-understand time calculations
 */

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface BookingSlot extends TimeSlot {
  available: boolean;
  reason?: string;
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Check if two time slots overlap
 * @param slot1Start - Start time of first slot (HH:MM)
 * @param slot1End - End time of first slot (HH:MM)
 * @param slot2Start - Start time of second slot (HH:MM)
 * @param slot2End - End time of second slot (HH:MM)
 * @returns true if slots overlap
 */
export function doSlotsOverlap(
  slot1Start: string,
  slot1End: string,
  slot2Start: string,
  slot2End: string,
): boolean {
  const start1 = timeToMinutes(slot1Start);
  const end1 = timeToMinutes(slot1End);
  const start2 = timeToMinutes(slot2Start);
  const end2 = timeToMinutes(slot2End);

  // Slots overlap if one starts before the other ends
  return start1 < end2 && start2 < end1;
}

/**
 * Generate all possible time slots for a day
 * @param startTime - Business start time (HH:MM)
 * @param endTime - Business end time (HH:MM)
 * @param slotDuration - Duration of each slot in minutes
 * @param slotIncrement - Increment between slots in minutes (default: slotDuration)
 * @returns Array of time slots
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotDuration: number,
  slotIncrement?: number,
): TimeSlot[] {
  const increment = slotIncrement || slotDuration;
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const slots: TimeSlot[] = [];

  for (
    let current = startMinutes;
    current + slotDuration <= endMinutes;
    current += increment
  ) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(current + slotDuration),
    });
  }

  return slots;
}

/**
 * Check if a time slot is within break time ranges
 * @param slotStart - Slot start time (HH:MM)
 * @param slotEnd - Slot end time (HH:MM)
 * @param breakTimes - Array of break time ranges
 * @returns true if slot overlaps with any break time
 */
export function isSlotInBreakTime(
  slotStart: string,
  slotEnd: string,
  breakTimes: TimeSlot[],
): boolean {
  return breakTimes.some((breakTime) =>
    doSlotsOverlap(slotStart, slotEnd, breakTime.start, breakTime.end),
  );
}

/**
 * Check if a time slot overlaps with existing bookings
 * @param slotStart - Slot start time (HH:MM)
 * @param slotEnd - Slot end time (HH:MM)
 * @param existingBookings - Array of booked time slots
 * @returns true if slot overlaps with any booking
 */
export function isSlotBooked(
  slotStart: string,
  slotEnd: string,
  existingBookings: TimeSlot[],
): boolean {
  return existingBookings.some((booking) =>
    doSlotsOverlap(slotStart, slotEnd, booking.start, booking.end),
  );
}

/**
 * Calculate available slots for booking
 * @param businessHours - Start and end time of business day
 * @param serviceDuration - Duration of service in minutes
 * @param existingBookings - Already booked slots
 * @param breakTimes - Break time ranges
 * @param slotIncrement - Increment between slots (default: 15 minutes)
 * @returns Array of slots with availability status
 */
export function calculateAvailableSlots(
  businessHours: TimeSlot,
  serviceDuration: number,
  existingBookings: TimeSlot[],
  breakTimes: TimeSlot[],
  slotIncrement: number = 15,
): BookingSlot[] {
  // Generate all possible slots
  const allSlots = generateTimeSlots(
    businessHours.start,
    businessHours.end,
    serviceDuration,
    slotIncrement,
  );

  // Mark each slot as available or not
  return allSlots.map((slot) => {
    // Check if slot is in break time
    if (isSlotInBreakTime(slot.start, slot.end, breakTimes)) {
      return {
        ...slot,
        available: false,
        reason: 'Break time',
      };
    }

    // Check if slot overlaps with existing booking
    if (isSlotBooked(slot.start, slot.end, existingBookings)) {
      return {
        ...slot,
        available: false,
        reason: 'Already booked',
      };
    }

    // Slot is available
    return {
      ...slot,
      available: true,
    };
  });
}

/**
 * Validate time string format (HH:MM)
 * @param time - Time string to validate
 * @throws BadRequestException if format is invalid
 */
export function validateTimeFormat(time: string): void {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    throw new BadRequestException(
      `Invalid time format: ${time}. Expected HH:MM (24-hour format)`,
    );
  }
}

/**
 * Validate date string format (YYYY-MM-DD)
 * @param date - Date string to validate
 * @throws BadRequestException if format is invalid
 */
export function validateDateFormat(date: string): void {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new BadRequestException(
      `Invalid date format: ${date}. Expected YYYY-MM-DD`,
    );
  }

  // Check if date is valid
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new BadRequestException(`Invalid date: ${date}`);
  }
}

/**
 * Check if date is in the past
 * @param date - Date string (YYYY-MM-DD)
 * @returns true if date is in the past
 */
export function isDateInPast(date: string): boolean {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate < today;
}

/**
 * Calculate end time given start time and duration
 * @param startTime - Start time (HH:MM)
 * @param durationMinutes - Duration in minutes
 * @returns End time (HH:MM)
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;

  // Check if end time exceeds 24 hours
  if (endMinutes >= 24 * 60) {
    throw new BadRequestException(
      'Booking extends past midnight. Please select an earlier time.',
    );
  }

  return minutesToTime(endMinutes);
}
