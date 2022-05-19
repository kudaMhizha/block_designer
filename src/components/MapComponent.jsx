import React, { useRef } from "react";
import { GoogleMap, useJsApiLoader, KmlLayer, Polygon, Polyline } from "@react-google-maps/api";
import { computeOffset, computeDistanceBetween } from 'spherical-geometry-js';
import './map.css'

//constants
const NORTH = 0;
const WEST = -90;
const SOUTH = 180;
const EAST = 90;

//const env = process.env
const containerStyle = {
  width: "800px",
  height: "800px",
};

const center = { // TODO: dynamically get the center of polygon 
  lat: -32.67261560482223,
  lng: 20.07672986669573,
};

function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: '',
    // libraries:"drawing",
  });

  const [map, setMap] = React.useState(null);
  const [polygons, setPolygons] = React.useState([])
  const [polyId, setPolyId] = React.useState(0)
  const polygonItem = useRef({})

  const onLoad = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  const calculateCorridorPlacement = 
  (numberOfTiers, corridorPlacement, northEast, northWest, southEast, southWest, corridorWidth, height) => {
    //Calculate Corridors: Width of corridor between North and South Sections
   
      const halfHeight = 0.5 * height
      const halfCw = 0.5 * corridorWidth
      let corridorCoords = []

      //calculate middle placement coords for a block
      const middlecorridornorthEast = computeOffset(northEast, halfHeight - halfCw, SOUTH)
      const middlecorridornorthWest = computeOffset(northWest, halfHeight - halfCw, SOUTH)
      const middlecorridorsouthEast = computeOffset(northEast, halfHeight + halfCw, SOUTH)
      const middlecorridorsouthWest = computeOffset(northWest, halfHeight + halfCw, SOUTH)

      if (numberOfTiers % 2 === 0) { //number of tiers == 2 or 4
        switch (corridorPlacement) {
          //[northEast, northWest, southWest, southEast]
            case 'top':
              corridorCoords = [
                northEast, 
                northWest,
                computeOffset(northWest, corridorWidth, SOUTH),
                computeOffset(northEast, corridorWidth, SOUTH)
              ]
              break;
            case 'bottom':
              corridorCoords = [
                computeOffset(southEast, 5, NORTH), 
                computeOffset(southWest, 5, NORTH), 
                southWest,
                southEast
              ]
              break;
            case 'mid-center':
                  corridorCoords = [
                    middlecorridornorthEast, 
                    middlecorridornorthWest,
                    middlecorridorsouthWest, 
                    middlecorridorsouthEast
                    
                  ]
              break;
            case 'mid-north':
                  corridorCoords = [
                    computeOffset(middlecorridornorthEast, corridorWidth, NORTH),
                    computeOffset(middlecorridornorthWest, corridorWidth, NORTH),
                    middlecorridornorthWest,
                    middlecorridornorthEast
                    
                  ]
              break;   
            case 'mid-south':
                  corridorCoords = [
                    middlecorridorsouthEast,
                    middlecorridorsouthWest,
                    computeOffset(middlecorridorsouthWest, corridorWidth, SOUTH),
                    computeOffset(middlecorridorsouthEast, corridorWidth, SOUTH)
                  ]
              break;                                  
            default:
              break;
        }
      } 
      else {
     //TODO: 3 tier blocks 
      //number of tiers = 3
      // FOR TIERS = 3 (Odds)
      //const MIDDLE_NORTH_PLACEMENT = [
      //  corridornorthEast = computeOffset(northEast, halfHeight - corridorWidth, NORTH);
      //  corridornorthWest = computeOffset(northWest, halfHeight - corridorWidth, NORTH);
      //  corridorsouthEast = middlecorridornorthEast
      //  corridorsouthWest = middlecorridornorthWest
      // ]

      //const MIDDLE_SOUTH_PLACEMENT = [
      //  corridornorthEast = middlecorridorsouthEast
      //  corridornorthWest = middlecorridorsouthWest
      //  corridorsouthEast = computeOffset(middlecorridorsouthEast, corridorWidth, SOUTH);
      //  corridorsouthWest = computeOffset(middlecorridorsouthWest, corridorWidth, SOUTH);
      // ]
      }

      return corridorCoords

  }

  const handleClick = (size, corridorPlacement) => {
      //NUMBER OF TIERS determine the number of combinations here we are using 5 (4tiers + 1) with a Cw of 5m.
      console.log(size)

      // const center = map.getCenter()
      const numberOfTiers = 4
      const height = 35; 
      const width = 26;
      const corridorWidth = 5

      const north = computeOffset(center, height / size, NORTH);
      const south = computeOffset(center, height / size, SOUTH);

      const northEast = computeOffset(north, width / size, EAST);
      const northWest = computeOffset(north, width / size, WEST);

      const southEast = computeOffset(south, width / size, EAST);
      const southWest = computeOffset(south, width / size, WEST);

      const corridorCoords = calculateCorridorPlacement(
        numberOfTiers, 
        corridorPlacement, 
        northEast, 
        northWest, 
        southEast, 
        southWest, 
        corridorWidth, 
        height
      )
 
      const corners = [northEast, northWest, southWest, southEast]; //to draw rectangle using polygon follow [NE, NW, SW, SE]
      // const corridorCoords = [corridorsouthEast, corridorsouthWest, computeOffset(corridorsouthWest, corridorWidth, SOUTH), computeOffset(corridorsouthEast, corridorWidth, SOUTH)]
      // const diff = computeDistanceBetween(corridornorthEast, corridorsouthEast)
      console.log('corridorCoords', corridorCoords)
      const convertedCorners = corners.map(coord =>(
        {lat: coord.latitude, lng: coord.longitude} 
      ))

      const convertedCorridorCorners = corridorCoords.map(coord =>(
        {lat: coord.latitude, lng: coord.longitude}
      ))

      const polyObject = {id: polyId, paths: [convertedCorners, convertedCorridorCorners.reverse()], blockSize: size === 2? 'Full-Sized':'Half-Sized'}
      setPolyId(polyId + 1)
      console.log(polyObject)
      //create new block
      // const polygon = new window.google.maps.Polygon({
      //   paths: convertedCorridorCorners,
      //   strokeColor: '#FF0000',
      //   strokeOpacity: 0.9,
      //   strokeWeight: 1,
      //   fillColor: '#FF0000',
      //   fillOpacity: 0.3,
      //   map,
      //   draggable: true,
      // });
      // console.log('polygon', polygon)
      setPolygons([...polygons, polyObject])
  }
  console.log(polygons)

  return isLoaded ? (
  <div>
    <div className='row'>
      <div className='map'>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={8}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            scollwheel: true,
            mapTypeId: 'satellite'
          }
          }
        >
          <KmlLayer
          url="https://mykml.s3.eu-west-1.amazonaws.com/example-kml.kml"
          options={{ preserveViewport: false, suppressInfoWindows: true }}
          />
          {
            polygons && polygons.map((poly) => {
            return (
            <Polygon
              onLoad={ () => console.log('ids', poly.id)}
              ref={(element) => polygonItem.current[poly.id] = element}
              key={poly.id}
              id={poly.id}
              paths={poly.paths}
              options={{
                strokeColor: '#FF0000',
                strokeOpacity: 0.9,
                strokeWeight: 1,
                fillColor: '#FF0000',
                fillOpacity: 0.3,
                draggable: true,
                // editable: true,
              }}
              onDragStart = { (e) => {
                  console.log('dragstart', e)
                  console.log('dragstart', polygonItem.current[poly.id])
                  const coordsArray = polygonItem.current[poly.id].state.polygon.latLngs.Hd[0].Hd
                  const lat = e.latLng.lat()
                  const lng = e.latLng.lng()
                  console.log({lat, lng})

                  coordsArray.forEach((latlng, index) => {
                    console.log(latlng.lat() + " - " + latlng.lng());
                  });
              }}
              onDragEnd = { (e) => {
                console.log('onDragEnd', e)
                const coordsArray = polygonItem.current[poly.id].state.polygon.latLngs.Hd[0].Hd
                console.log('onDragEnd', polygonItem.current[poly.id])
                //console.log('state', coordsArray) //get active Polygon ID
                const lat = e.latLng.lat()
                const lng = e.latLng.lng()
                console.log({lat, lng})

                coordsArray.forEach((latlng, index) => {
                  console.log(latlng.lat() + " - " + latlng.lng());
                });
              }}
              onDblClick = { () => {
                //console.log('e', e)
                console.log('state', polygonItem.current[poly.id])
                polygonItem.current[poly.id].state.polygon.setMap(null)
              }}
              onRightClick = { (e) => {
                const infowindow = new window.google.maps.InfoWindow()

                const infoWindowContent = `
                  <b> BLOCK with ID: ${poly.id}</b>
                  <br>
                  Location: <b>${e.latLng.lat()}, ${e.latLng.lng()}</b>
                  <br>
                  Block Size: <b>${poly.blockSize}</b>
                  <br>
                  <button onclick="myFunction()"> Click Me <button>

                  <script>
                    function myFunction() {
                      polygonItem.current[poly.id].state.polygon.setMap(null)
                    }
                  </script>
                `
                infowindow.setContent(infoWindowContent);
                infowindow.setPosition(e.latLng);
                infowindow.open(map);
              }}
            />)
        })
          }
        </GoogleMap>
      </div>
      <div className='toolbox'>
        <h1>FULL-SIZED BLOCKS</h1>
        <span></span>
        {/* <button className='button' onClick={ () => handleClick(2) }>Add Full-sized block</button>
        <button className='button' onClick={ () => handleClick(4) }>Add Half-sized block</button>
        <button className='button' onClick={ () => handleClick(4) }>Add Half-sized block</button> */}
        <button className='button'><img src="images/top.png" alt="top" onClick={ () => handleClick(2, 'top')} /></button>        
        <button className='button'><img src="images/bottom.png" alt="top" onClick={ () => handleClick(2, 'bottom')} /></button>
        <button className='button'><img src="images/mid1.png" alt="top" onClick={ () => handleClick(2, 'mid-center')} /></button>
        <button className='button'><img src="images/mid2.png" alt="top" onClick={ () => handleClick(2, 'mid-north')} /></button>
        <button className='button'><img src="images/mid3.png" alt="top" onClick={ () => handleClick(2, 'mid-south')} /></button>
      </div>
    </div>
  </div>

  ) : (
    <></>
  );
}

export default React.memo(MapComponent);
