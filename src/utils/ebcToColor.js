// SRM color array (indices 0-42 representing SRM values 0-42)
const srmColorArray = [
  'FFFFFF', 'FFF099', 'FFE699', 'FFD878', 'FFCA5A', 'FFBF42', 'FBB123', 'F8A600',
  'F39C00', 'EA8F00', 'E58500', 'DE7C00', 'D77200', 'CF6900', 'CB6200', 'C35900',
  'BB5100', 'B54C00', 'B04500', 'A63E00', 'A13700', '9B3200', '952D00', '8E2900',
  '882300', '821E00', '7B1A00', '771900', '701400', '6A0E00', '660D00', '5E0B00',
  '5A0A02', '600903', '520907', '4C0505', '470606', '440607', '3F0708', '3B0607',
  '3A070B', '36080A', '1E0204'
];

/**
 * Converts EBC value to hex color
 * @param {number} ebc - EBC value of the beer
 * @returns {string} Hex color string (e.g., "#FFD878")
 */
function ebcToHex(ebc) {
  // Convert EBC to SRM using standard formula
  const srm = ebc / 1.97;
  
  // Round to nearest integer
  const srmRounded = Math.round(srm);
  
  // Get color from array, using darkest color for SRM > 42
  let color;
  if (srmRounded > 42) {
    color = '1E0204'; // Darkest color for very dark beers
  } else {
    const index = Math.max(0, Math.min(42, srmRounded));
    color = srmColorArray[index];
  }
  
  return `#${color}`;
}

export default ebcToHex;
