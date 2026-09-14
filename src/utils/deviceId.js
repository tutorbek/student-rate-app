/**
 * Device Identification and Student Binding Utilities
 * Ensures each student profile can be bound to a single device/phone
 * to prevent classmates from tampering with each other's avatars.
 */

export const getOrCreateDeviceId = () => {
  if (typeof window === 'undefined') {
    return 'server_device';
  }

  try {
    const existing = localStorage.getItem('rsa_device_id');
    if (existing && typeof existing === 'string' && existing.trim().length > 0) {
      return existing.trim();
    }

    // Generate robust unique device token
    const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const randomPart = Math.random().toString(36).substring(2, 10);
    const timePart = Date.now().toString(36);

    const newId = tgUserId
      ? `tg_${tgUserId}_${randomPart}`
      : `dev_${timePart}_${randomPart}`;

    localStorage.setItem('rsa_device_id', newId);
    return newId;
  } catch (err) {
    console.warn('[deviceId] Failed to access localStorage:', err);
    return 'fallback_device';
  }
};

/**
 * Checks if a student is bound to a device different from the current one.
 * Returns true if locked to another phone, false if unassigned or owned by this device.
 */
export const isStudentClaimedByAnotherDevice = (student, currentDeviceId) => {
  if (!student || !student.deviceId) {
    return false; // Not claimed by anyone yet
  }

  if (!currentDeviceId) {
    return true; // Student is claimed, but we have no deviceId
  }

  return String(student.deviceId) !== String(currentDeviceId);
};
