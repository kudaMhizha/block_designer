import { computeOffset } from "spherical-geometry-js";
import Cardinals from "../constants/config";

const { NORTH, SOUTH, WEST, EAST } = Cardinals;

/**
 * Helper function to compute block corridor placement
 *
 * @param block - object {numberOfTiers,corridorPlacement, northEast, northWest, southEast, southWest, corridorWidth, height}
 */
export const calculateCorridorPlacement = (block) => {
  //Corridors: Width of corridor between North and South Sections
  const {
    numberOfTiers,
    corridorPlacement,
    northEast,
    northWest,
    southEast,
    southWest,
    corridorWidth,
    height,
  } = block;
  const halfHeight = 0.5 * height;
  const halfCw = 0.5 * corridorWidth;
  const mod = numberOfTiers % 2 === 1;
  let corridorCoords = [];
  console.log({ numberOfTiers, halfHeight, halfCw });

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

  if (mod) {
    //number of tiers is odd (3 or 5)
    switch (corridorPlacement) {
      //to draw rectangle using polygon follow [NE, NW, SW, SE]
      case "top":
        corridorCoords = [
          northEast,
          northWest,
          computeOffset(northWest, corridorWidth, SOUTH),
          computeOffset(northEast, corridorWidth, SOUTH),
        ];
        break;
      case "bottom":
        corridorCoords = [
          computeOffset(southEast, corridorWidth, NORTH),
          computeOffset(southWest, corridorWidth, NORTH),
          southWest,
          southEast,
        ];
        break;
      case "mid-center":
        corridorCoords = [
          middlecorridornorthEast,
          middlecorridornorthWest,
          middlecorridorsouthWest,
          middlecorridorsouthEast,
        ];
        break;
      case "mid-north":
        corridorCoords = [
          computeOffset(middlecorridornorthEast, corridorWidth, NORTH),
          computeOffset(middlecorridornorthWest, corridorWidth, NORTH),
          middlecorridornorthWest,
          middlecorridornorthEast,
        ];
        break;
      case "mid-south":
        corridorCoords = [
          middlecorridorsouthEast,
          middlecorridorsouthWest,
          computeOffset(middlecorridorsouthWest, corridorWidth, SOUTH),
          computeOffset(middlecorridorsouthEast, corridorWidth, SOUTH),
        ];
        break;
      default:
        break;
    }
  } else {
    //number of tiers = 2 or 4
    switch (corridorPlacement) {
      //to draw rectangle using polygon follow [NE, NW, SW, SE]
      case "top":
        corridorCoords = [
          northEast,
          northWest,
          computeOffset(northWest, corridorWidth, SOUTH),
          computeOffset(northEast, corridorWidth, SOUTH),
        ];
        break;
      case "bottom":
        corridorCoords = [
          computeOffset(southEast, corridorWidth, NORTH),
          computeOffset(southWest, corridorWidth, NORTH),
          southWest,
          southEast,
        ];
        break;
      case "mid-north":
        corridorCoords = [
          middlecorridornorthEast,
          middlecorridornorthWest,
          middleBlockWest,
          middleBlockEast,
        ];
        break;
      case "mid-south":
        corridorCoords = [
          middleBlockEast,
          middleBlockWest,
          middlecorridorsouthWest,
          middlecorridorsouthEast,
        ];
        break;
      default:
        break;
    }
  }

  return corridorCoords;
};

/**
 * Helper function to calculate cardinals for a Block
 *
 * @param center - map center
 * @param height - block height
 * @param width - block width
 * @param size - half or full sized
 */
export const computeCardinals = (center, height, width, size) => {
  const north = computeOffset(center, height / size, NORTH);
  const south = computeOffset(center, height / size, SOUTH);

  const northEast = computeOffset(north, width / size, EAST);
  const northWest = computeOffset(north, width / size, WEST);

  const southEast = computeOffset(south, width / size, EAST);
  const southWest = computeOffset(south, width / size, WEST);

  return [northEast, northWest, southWest, southEast];
};