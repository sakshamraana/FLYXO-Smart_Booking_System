const validateIdProof = (type, number) => {
  if (!type || !number) {
    return { valid: false, message: 'ID proof type and number are required.' };
  }

  const cleanNum = number.trim().toUpperCase();

  switch (type.toUpperCase()) {
    case 'AADHAR':
      if (!/^\d{12}$/.test(cleanNum)) {
        return { valid: false, message: 'Aadhar card number must be exactly 12 numeric digits.' };
      }
      break;
    case 'PAN':
      if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(cleanNum)) {
        return { valid: false, message: 'PAN card format must be 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F).' };
      }
      break;
    case 'DRIVING_LICENSE':
      if (!/^[A-Z0-9\-\s]{8,18}$/.test(cleanNum) || cleanNum.length < 8) {
        return { valid: false, message: 'Driving License must be between 8 and 18 alphanumeric characters.' };
      }
      break;
    case 'PASSPORT':
      if (!/^[A-Z]\d{7}$/.test(cleanNum)) {
        return { valid: false, message: 'Passport number must be 1 uppercase letter followed by 7 digits (e.g. A1234567).' };
      }
      break;
    default:
      return { valid: false, message: 'Invalid ID proof type. Choose AADHAR, PAN, DRIVING_LICENSE, or PASSPORT.' };
  }

  return { valid: true };
};

const checkAgeRestriction = (userAge, movieMinimumAge) => {
  if (userAge < movieMinimumAge) {
    return {
      allowed: false,
      message: `Age Restriction Error: You must be at least ${movieMinimumAge} years old to view this movie. Your registered age is ${userAge}.`,
    };
  }
  return { allowed: true };
};

module.exports = {
  validateIdProof,
  checkAgeRestriction,
};
