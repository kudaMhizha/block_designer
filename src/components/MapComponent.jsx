import React, { useRef, useCallback, useState, memo } from "react";
import { GoogleMap, useJsApiLoader, KmlLayer, Polygon } from "@react-google-maps/api";
import './map.css'
import { calculateCorridorPlacement, computeCardinals, calculateBlockDimensions, formatCoordinates } from '../utils'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
const center = { // TODO: dynamically get the center of polygon 
  lat: -32.67261560482223,
  lng: 20.07672986669573,
};

const containerStyle = {
  width: "800px",
  height: "800px",
};

const polygonStyling = {
  strokeColor: '#fada00',
  strokeOpacity: 0.9,
  strokeWeight: 3,
  fillColor: '#fada00',
  fillOpacity: 0.3,
  draggable: true
}

const libraries = ['geometry']

function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLEMAPSAPIKEY,
    libraries,
  });

  const [map, setMap] = useState(null);
  const [polygons, setPolygons] = useState([])
  const [polyId, setPolyId] = useState(0)
  const polygonItem = useRef({})

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);


  const handleClick = (size, corridorPlacement) => {
      /* 
      {numberOfTiers} determines the number of combinations 
      here we are using 5 (4tiers + 1) with a Cw of 5m.

      numberOfTiers is calculated as: 
        if(targetBlockSize <= 2.5) numberOfTiers = 2 
        if(targetBlockSize >= 2.5 && targetBlockSize <= 5) numberOfTiers = 3 
        if(targetBlockSize > 5) numberOfTiers = 4

        Assumptions - Target Block Size = 7,5 (half = 3.75)
        - height = 36
        - width = 26
        - numberOfTiers(full-sized) = 5
        - numberOfTiers(half-sized) = 4
      */
     //TODO: refactor size parameter - use block_type [full or half]

      const { blockHeight, blockWidth, corridorWidth, numberOfTiers } = calculateBlockDimensions(size)
      const blockCoords = computeCardinals(center, blockHeight, blockWidth);
      const [northEast, northWest, southWest, southEast ] = blockCoords

      const blockDetails = { numberOfTiers, corridorPlacement, northEast, northWest, southEast, southWest, corridorWidth, blockHeight }
      const corridorCoords = calculateCorridorPlacement(blockDetails)
      const blockCorners = formatCoordinates(blockCoords)
      const corridorCorners = formatCoordinates(corridorCoords)

      const polyObject = {
        id: `BK0${polyId + 1}`, 
        paths: [blockCorners, corridorCorners.reverse()], 
        blockSize: size === 2? 'Full Block':'Half Block'
      }

      setPolyId(polyId + 1) //TODO: need a better way to allocate Polygon IDs
      setPolygons([...polygons, polyObject])
  }
  console.table(polygons)
  /*
  TODO: Map needs to be in IDLE status for the Drag in functionality to work. 
  */
  const handleDragIn = (e) => {
    //the projection object is only created when the map is idle or user zooms in/out
    const overlay = new window.google.maps.OverlayView();
    overlay.draw = function() {};
    overlay.setMap(map);

    const x = e.pageX - 400

    const y = e.pageY + 100;
    if(x > 0) {
      // the image is inside the position of the map
      const point = new window.google.maps.Point(x, y);
      const position = overlay.getProjection().fromContainerPixelToLatLng(point);
      console.log('point', {lat: position.lat(), lng: position.lng()})

      // new window.google.maps.Marker({
      //   position: new window.google.maps.LatLng(position.lat(), position.lng()),
      //   map: map,
      //   draggable: true,
      //   title: 'test'
      // });

  }
  }

  const kmzUrl = process.env.REACT_APP_KMZ_LINK
  const RenderKMZRegion = () => (
    <>
      <KmlLayer
      url={kmzUrl}
      options={{ preserveViewport: false, suppressInfoWindows: true }}
      />
    </>
  )


  return isLoaded ? (
  <div>
    <div className='row'>
    <div>

    </div>
      <div className='map'>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={8}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={ (e) => console.log(e)}
          options={{
            scollwheel: true,
            mapTypeId: 'satellite'
          }
          }
        >
          <RenderKMZRegion/>
          {
          polygons && polygons.map((poly) => {
            return (
                <Polygon
                  onLoad={ () => console.log('Block ID: ', poly.id)}
                  ref={(element) => polygonItem.current[poly.id] = element}
                  key={poly.id}
                  id={poly.id}
                  paths={poly.paths}
                  options={polygonStyling}
                  onDragStart = { (e) => {
                      //get coordsArray for the Block (index = 1 contains coords for corridors)
                      const coordsKey =   
                      Object.keys(polygonItem.current[poly.id].state.polygon.latLngs)
                        .find( (key) => key.length === 2
                      )
                      const coordsArray = polygonItem.current[poly.id].state.polygon.latLngs[coordsKey][0][coordsKey]
                      // console.log('coordsArray', coordsArray)
                      //drag event clicked point coords
                      const lat = e.latLng.lat()
                      const lng = e.latLng.lng()
                      const compass = ['NE','NW','SW', 'SE']
                      const corners = []

                      console.log('onDragStart')
                      coordsArray.forEach((latlng, index) => {
                        const coord = {lat: latlng.lat(), lng: latlng.lng()}
                        corners.push({corner: compass[index], coordinates: "LAT: " + coord.lat + ", LNG:" + coord.lng});
                      });
                      console.table(corners);
                  }}
                  onDragEnd = { (e) => {
                    const coordsKey =   
                    Object.keys(polygonItem.current[poly.id].state.polygon.latLngs)
                      .find( (key) => key.length === 2
                    )
                    const coordsArray = polygonItem.current[poly.id].state.polygon.latLngs[coordsKey][0][coordsKey]
                    // console.log('onDragEnd', coordsArray)
                    
                    const lat = e.latLng.lat()
                    const lng = e.latLng.lng()
                    
                    const compass = ['NE','NW','SW', 'SE']
                    const corners = []

                      console.log('onDragEnd')
                      coordsArray.forEach((latlng, index) => {
                        const coord = {lat: latlng.lat(), lng: latlng.lng()}
                        corners.push({corner: compass[index], coordinates: "LAT: " + coord.lat + ", LNG:" + coord.lng});
                      });
                      console.table(corners);
                  }}
                  onClick = { () => {
                    console.log('delete', polygonItem.current[poly.id])
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
                    `
                    infowindow.setContent(infoWindowContent);
                    infowindow.setPosition(e.latLng);
                    infowindow.open(map);
                  }}
                />
            )}
            )
          }
        </GoogleMap>
      </div>
      <div className='toolbox'>
        <h1>HALF BLOCKS</h1>
        <div>
          <button className='button'><img src="images/top.png" alt="top" onClick={ () => handleClick(4, 'top')}/></button>
          <button className='button'><img src="images/bottom.png" alt="bottom" onClick={ () => handleClick(4, 'bottom')}/></button>
          <button className='button'><img src="images/center-top.png" alt="mid-north" onClick={ () => handleClick(4, 'mid-north')}/></button>
          <button className='button'><img src="images/center-bottom.png" alt="mid-south" onClick={ () => handleClick(4, 'mid-south')}/></button>
        </div>
        <h1>FULL BLOCKS</h1>
        <div>
          <button className='button'><img src="images/top.png" alt="top" onClick={ () => handleClick(2, 'top')} onDragEnd={handleDragIn} /></button>        
          <button className='button'><img src="images/bottom.png" alt="bottom" onClick={ () => handleClick(2, 'bottom')} onDragEnd={handleDragIn}/></button>
          <button className='button'><img src="images/center-top.png" alt="mid-north" onClick={ () => handleClick(2, 'mid-north')}onDragEnd={handleDragIn} /></button>
          <button className='button'><img src="images/center.png" alt="mid-center" onClick={ () => handleClick(2, 'mid-center')} onDragEnd={handleDragIn}/></button>
          <button className='button'><img src="images/center-bottom.png" alt="mid-south" onClick={ () => handleClick(2, 'mid-south')} onDragEnd={handleDragIn}/></button>
        </div>
        

      </div>
    </div>
  </div>

  ) : (
    <>Loading...</>
  );
}

export default memo(MapComponent);
