import React from 'react';
import styles from './Occupants.module.css';
import { DirectionsWalk, AccessibilityNew, AirlineSeatReclineNormal } from '@mui/icons-material';

export const PeopleIcon = () => (
  <svg className={styles['icon']} viewBox="0 0 24 24">
    <path fill="#DCDCDC" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

export const HotelIcon = () => (
  <svg className={styles['icon']} viewBox="0 0 24 24">
    <path fill="#DCDCDC" d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
  </svg>
);

export const DirectionsRunIcon = () => (
  <svg className={styles['icon']} viewBox="0 0 24 24">
    <path fill="#DCDCDC" d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
  </svg>
);

// Add these new icons
export const DirectionsWalkIcon = () => (
  <DirectionsWalk className={styles['icon']} />
);

export const AccessibilityNewIcon = () => (
  <AccessibilityNew className={styles['icon']} />
);

// Add the new Sitting icon
export const SittingIcon = () => (
  <AirlineSeatReclineNormal className={styles['icon']} />
);