import React from 'react';

export type Language = 'ar' | 'en';
export type DayStatus = 'available' | 'busy' | 'closed';

export interface Booking {
  id: string;
  fullName: string;
  phone: string;
  carModel: string;
  licensePlate: string;
  serviceType: string;
  dateTime: string;
  notes?: string;
  status: number; // 0 to 6 representing the steps
  createdAt: string;
}

export interface Service {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: React.ReactNode;
}

export interface AdminSettings {
  notifyOnBooking: boolean;
  notifyOnStatusUpdate: boolean;
  notifyOnCarReady: boolean;
  availability: Record<string, DayStatus>; // Key: YYYY-MM-DD
}