/**
 * All template blocks will be fixed rectangles. 
 * The width and height of these rectangles will be determined through values 
 * provided by the user during configuration as well as API calls and calculations.
 * 
 * @param wTB - target block size (megaWatts)
 * @param pitch 
 * @param corridorWidth 
 * @param nMS - numberOfModulesPerString
 * @param cTO - trackerOverhangClearance
 * @param size - full size or half size block 

**/
export const blockCalculations = (size) => {
  //(a) Parameters determined from configuration steps (User Input)
  const wTB = size === 4 ? 0.75: 2.5;
  const pitch = 6;
  const corridorWidth = 25;
  const nMS = 28;
  const cTO = 1;

  /* (b) Parameters provided via API call to AutoPV 
  make query to API (fetch Equipment): {store}/catalogue
  ModuleID(Module) & TrackerID(Main Tracker) - based on item selected on Dropdowns. 
  */
  const { wModule, lTrac, wTrack, nST } = getModuleTrackerParameters();

  // (c) Parameters determined by the UI

  const numberOfTiers = wTB <= 2.5 ? 2 : wTB <= 5 ? 3 : 4; 
  const wString = wModule * nMS; //stringCapacity
  const nString = Math.ceil((wTB * 1000000) / wString); //numberOfBlockStrings
  const nSR = numberOfTiers * nST; //numberOfStringsPerRow
  const nRow = Math.ceil(nString / nSR); //numberOfRowsPerBlock

  const blockHeight =
    numberOfTiers * lTrac + 2 * (numberOfTiers - 1) * cTO + corridorWidth;
  const blockWidth = nRow * pitch;

  const wB = nRow * nSR * nMS * wModule; //Actual Block DC Size in Watts
  const fakeTiers = size === 4 ? 4 : 5;
  console.table({ blockHeight, blockWidth, corridorWidth, numberOfTiers: fakeTiers });
  return { blockHeight, blockWidth, corridorWidth, numberOfTiers };
};

const getModuleTrackerParameters = () => {
  const wModule = 515; // moduleCapacity (Watts)
  const lTrac = 84; //trackerLength
  const wTrack = 2; //trackerWidth
  const nST = 3; //stringsPerTracker

  return { wModule, lTrac, wTrack, nST };
};

