import { computeOffset } from "spherical-geometry-js";
import config from "../constants/config";
import { blockCalculations } from './blockCalculations'

const { NORTH, SOUTH, WEST, EAST } = config;

/**
* Helper function to format coordinates for Polygon corners
* @param coords - latitude and longitude coords
**/
export const formatCoordinates = (coords) =>
  coords.map((coord) => ({
    lat: coord.latitude,
    lng: coord.longitude,
  }));

export const calculateBlockDimensions = blockCalculations
/**
 * Helper function to compute block corridor placement
 *
 * @param block - object {numberOfTiers,corridorPlacement, northEast, northWest, southEast, southWest, corridorWidth, height}
 */
export const calculateCorridorPlacement = (block) => {
  //Corridors: Width of corridor between North and South Sections
  let corridorCoords = [];
  const {
    numberOfTiers,
    corridorPlacement,
    northEast,
    northWest,
    southEast,
    southWest,
    corridorWidth,
    blockHeight,
  } = block;
  const halfHeight = 0.5 * blockHeight;
  const halfCw = 0.5 * corridorWidth;
  const mod = (numberOfTiers + 1) % 2 === 1;
  // console.log({ numberOfTiers, blockHeight, corridorWidth, mod });

//   [
//     middlecorridornorthEast,
//     middlecorridornorthWest,
//     middleBlockWest,
//     middleBlockEast,
//   ];
  //for tiers = 4
  const middleBlockEast = computeOffset(northEast, halfHeight, SOUTH);
  const middleBlockWest = computeOffset(northWest, halfHeight, SOUTH);
  //middle placement coords for a block
  const middlecorridornorthEast = mod
    ? computeOffset(northEast, halfHeight - halfCw, SOUTH)
    : computeOffset(middleBlockEast, corridorWidth, NORTH);

  const middlecorridornorthWest = mod
    ? computeOffset(northWest, halfHeight - halfCw, SOUTH)
    : computeOffset(middleBlockWest, corridorWidth, NORTH);

  const middlecorridorsouthEast = mod
    ? computeOffset(northEast, halfHeight + halfCw, SOUTH)
    : computeOffset(middleBlockEast, corridorWidth, SOUTH);

  const middlecorridorsouthWest = mod
    ? computeOffset(northWest, halfHeight + halfCw, SOUTH)
    : computeOffset(middleBlockWest, corridorWidth, SOUTH);

  const topPlacement = [
    northEast, 
    northWest, 
    computeOffset(northWest, corridorWidth, SOUTH),
    computeOffset(northEast, corridorWidth, SOUTH),
  ]
  const bottomPlacement = [
    computeOffset(southEast, corridorWidth, NORTH),
    computeOffset(southWest, corridorWidth, NORTH),
    southWest,
    southEast,
  ];

  const centerPlacement = [
    middlecorridornorthEast,
    middlecorridornorthWest,
    middlecorridorsouthWest,
    middlecorridorsouthEast,
  ];

  if (mod) {
    //number of tiers is odd (3 or 5)
    switch (corridorPlacement) {
      //to draw rectangle using polygon follow [NE, NW, SW, SE]
      case "top":
        return topPlacement
      case "bottom":
        return bottomPlacement
      case "mid-center":
        return centerPlacement
      case "mid-north":
        return [
          computeOffset(middlecorridornorthEast, corridorWidth, NORTH),
          computeOffset(middlecorridornorthWest, corridorWidth, NORTH),
          middlecorridornorthWest,
          middlecorridornorthEast,
        ];
      case "mid-south":
        return [
          middlecorridorsouthEast,
          middlecorridorsouthWest,
          computeOffset(middlecorridorsouthWest, corridorWidth, SOUTH),
          computeOffset(middlecorridorsouthEast, corridorWidth, SOUTH),
        ];
      default:
        break;
    }
  } else {
    //number of tiers = 2 or 4
    switch (corridorPlacement) {
      //to draw rectangle using polygon follow [NE, NW, SW, SE]
      case "top":
        return topPlacement;
      case "bottom":
        return bottomPlacement;
      case "mid-north":
        return [
          middlecorridornorthEast,
          middlecorridornorthWest,
          middleBlockWest,
          middleBlockEast,
        ];
      case "mid-south":
        return [
          middleBlockEast,
          middleBlockWest,
          middlecorridorsouthWest,
          middlecorridorsouthEast,
        ];
      default:
        break;
    }
  }

  return [];
};

/**
 * Helper function to calculate cardinals for a Block
 *
 * @param center - map center
 * @param height - block height
 * @param width - block width
 * @param size - half or full sized
 */
export const computeCardinals = (center, height, width) => {
  
  const north = computeOffset(center, height / 2, NORTH);
  const south = computeOffset(center, height / 2, SOUTH);

  const northEast = computeOffset(north, width / 2, EAST);
  const northWest = computeOffset(north, width / 2, WEST);

  const southEast = computeOffset(south, width / 2, EAST);
  const southWest = computeOffset(south, width / 2, WEST);

  return [northEast, northWest, southWest, southEast];
};
