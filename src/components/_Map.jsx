// import React, { Component } from "react";
// import MapGL from "react-map-gl";
// import {
//   Editor,
//   DrawPolygonMode,
//   DrawLineStringMode,
//   EditingMode,
// } from "react-map-gl-draw";
// import Geocoder from 'react-map-gl-geocoder';
// import config from "../config";

// const MODES = [
//   { id: "drawPolyline", text: "Draw Polyline", handler: DrawLineStringMode },
//   { id: "drawPolygon", text: "Draw Polygon", handler: DrawPolygonMode },
//   { id: "editing", text: "Edit Feature", handler: EditingMode },
// ];

// export default class Map extends Component {
//   state = {
//     viewport: {
//       width: "100vw",
//       height: "100vh",
//       longitude: -81.002197,
//       latitude: 34.079962,
//       zoom: 14,
//     },
//   };

//   _switchMode = (evt) => {
//     const modeId =
//       evt.target.value === this.state.modeId ? null : evt.target.value;
//     const mode = MODES.find((m) => m.id === modeId);
//     const modeHandler = mode ? new mode.handler() : null;
//     this.setState({ modeId, modeHandler });
//   };

//   _renderToolbar = () => {
//     return (
//       <div
//         style={{ position: "absolute", top: 0, right: 0, maxWidth: "320px" }}
//       >
//         <select onChange={this._switchMode}>
//           <option value="">--Please choose a draw mode--</option>
//           {MODES.map((mode) => (
//             <option key={mode.id} value={mode.id}>
//               {mode.text}
//             </option>
//           ))}
//         </select>
//       </div>
//     );
//   };

//   mapRef = React.useRef()

//   handleViewportChange = (viewport) => {
//     this.setState({
//       viewport: { ...this.state.viewport, ...viewport }
//     })
//   }
 
//   // if you are happy with Geocoder default settings, you can just use handleViewportChange directly
//   handleGeocoderViewportChange = (viewport) => {
//     const geocoderDefaultOverrides = { transitionDuration: 1000 }
 
//     return this.handleViewportChange({
//       ...viewport,
//       ...geocoderDefaultOverrides
//     })
//   }

//   render() {
//     // const {viewport} = this.state;
//     return (
//       <div className="App">
//         <MapGL
//           {...this.state.viewport}
//           onViewportChange={(viewport) => this.setState({ viewport })}
//           mapboxApiAccessToken={config.MAPBOX_API_TOKEN}
//           mapStyle="mapbox://styles/mapbox/streets-v11"
//         >
//           <Editor clickRadius={12} mode={new DrawPolygonMode()} />
//           {this._renderToolbar()}
//           {/* <Geocoder
//             mapRef={this.mapRef}
//             onViewportChange={this.handleGeocoderViewportChange}
//             mapboxApiAccessToken={config.MAPBOX_API_TOKEN}
//         >
//         </Geocoder> */}
//         </MapGL>
//       </div>
//     );
//   }
// }
