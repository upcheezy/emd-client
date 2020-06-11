import React, { Component } from "react";
import "./Map.css";
import mapboxgl from "mapbox-gl";
import CountyDropdown from "./CountyDropdown";
import config from "../config";
const MapboxDraw = require("@mapbox/mapbox-gl-draw");
const MapboxGeocoder = require("@mapbox/mapbox-gl-geocoder");
const Parse = require("wellknown");

export default class Map extends Component {
  state = {
    error: null,
    members: [],
    grid: [],
  };

  componentDidMount() {
    mapboxgl.accessToken = config.MAPBOX_API_TOKEN;
    window.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-81.276855, 33.596319],
      zoom: 7,
    });
    // call fetchgrid and get the grid id and the geom
    // then convert the geom into geojson and save it as a variable to pass
    // to map.fitbounds
    const fetchGrid = () => {
      fetch("http://gis17-01:8000/grid", {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(res.status);
          }
          return res.json();
        })
        .then((data) => {
          let gridRowId = window.localStorage.getItem('id').split(',')
          // console.log(data.rows)
          // console.log(gridRowId)
          let matching = [];
          gridRowId.map((element) => {
            const idContains = data.rows.find(id_element => id_element.id === parseInt(element))
            if (typeof idContains !== 'undefined') matching.push(idContains)
          })
          // console.log(matching)
          const gridGeom = matching.map(g => Parse(g.geom))
          // console.log(gridGeom)
          // let gridParse = Parse(matching[0].geom);
          const gridCoords = gridGeom.map(gg => gg.coordinates[0][0])
          // console.log(gridCoords);
          // if (window.map.getLayer('maine')) window.map.removeLayer('maine');
          window.map.addSource("maine", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "MultiPolygon",
                coordinates: [gridCoords],
              },
            },
          });
          window.map.addLayer({
            id: "maine",
            type: "fill",
            source: "maine",
            layout: {},
            paint: {
              "fill-color": "#088",
              "fill-opacity": 0.8,
            },
          });
          
        })
        .catch((error) => this.setState({ error }));
    };

    
    const fetchIntersect = (datapoints, type) => {
      fetch("http://gis17-01:8000/draw", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          coords: datapoints,
          geomtype: type,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(res.status);
          }
          return res.json();
        })
        .then((data) => {
          console.log(data);
          const gridIdz = {};
          data.rows.forEach((row) => {
            // console.log(row.id_array)
            row.id_array.forEach((gid) => {
              // console.log(gid)
              if(!gridIdz[gid]){
                console.log(gridIdz[gid])
                gridIdz[gid] = 1
              }
            })
          })
          console.log(Object.keys(gridIdz))
          // console.log(data);
          this.setState({
            members: Object.values(data.rows),
          });
          window.localStorage.setItem('id', null)
          if(window.localStorage.getItem('id')){
            console.log('inside if')
            window.localStorage.removeItem('id')
          }
          window.localStorage.setItem('id',Object.keys(gridIdz))
          fetchGrid();
        })
        .catch((error) => this.setState({ error }));
    };
    
    const address = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      countries: 'us',
      bbox: [-83.726807,31.784217,-78.013916,35.415915]
    }).on("result", function ({ result }) {
      // console.log(result.geometry.coordinates);
      fetchIntersect(result.geometry.coordinates, "point");
      fetchGrid();
    });
    window.map.addControl(address);

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });
    window.map.addControl(draw);

    const updateArea = (e) => {
      // let dataId
      // if (draw.getAll().features.length > 1) draw.deleteAll()
      const data = draw.getAll();
      // dataId = draw.getAll().features[0].id
      // console.log(dataId)

      console.log(data, data.features);
      if (data.features.length > 0) {
        fetchIntersect(data.features[0].geometry.coordinates[0], "draw");
      }
      
      
    };

    // let gCoords = this.state;
    window.map.on("draw.create", updateArea);
    window.map.on("draw.delete", updateArea);
    window.map.on('draw.update', updateArea);
  }

  countyChecker(name) {
    // console.log(name);
    fetch("http://gis17-01:8000/countyselect", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        countyname: name,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log(Object.values(data.rows));
        // console.log(typeof data.values)
        const gridIdz = {};
          data.rows.forEach((row) => {
            // console.log(row.id_array)
            row.id_array.forEach((gid) => {
              // console.log(gid)
              if(!gridIdz[gid]){
                console.log(gridIdz[gid])
                gridIdz[gid] = 1
              }
            })
          })
          console.log(Object.keys(gridIdz))
        this.setState({ members: Object.values(data.rows) });
        window.localStorage.setItem('id', null)
        if(window.localStorage.getItem('id')){
          console.log('inside if')
          window.localStorage.removeItem('id')
        }
        window.localStorage.setItem('id',Object.keys(gridIdz))
        // fetchGrid();
      })
      .catch((error) => this.setState({ error }));
  }

  layerSwitcher(e) {
    let layerId = e.target.id;
    window.map.setStyle("mapbox://styles/mapbox/" + layerId);
  }

  render() {
    // console.log(this.state.grid);
    return (
      <div className="container">
        <div id="map"></div>
        <div className="flex-container">
          <div className="layerMenu">
            <input
              type="radio"
              id="streets-v11"
              value="streets"
              checked="checked"
              name="rtoggle"
              onClick={(e) => this.layerSwitcher(e)}
            />
            <label htmlFor="streets-v11">Streets</label>
            <input
              type="radio"
              id="satellite-streets-v10"
              name="rtoggle"
              value="satellite"
              onClick={(e) => this.layerSwitcher(e)}
            />
            <label htmlFor="satellite-streets-v10">Satellite</label>
          </div>
          <CountyDropdown onAction={this.countyChecker.bind(this)} />
        </div>
        <div className="sideNav">
          <h1>Affected Members</h1>
          <section className="member_list">
            <ul>
              {this.state.members.map((x) => (
                // give li class to style
                <li className="member_li">
                  <span style={{ fontWeight: "bold" }}> Code: </span>
                  {x.code} <span style={{ fontWeight: "bold" }}>Org: </span>
                  {x.orgname}{" "}
                  <span style={{ fontWeight: "bold" }}>Person: </span>
                  {x.personname}{" "}
                  <span style={{ fontWeight: "bold" }}>Email: </span>
                  {x.emailaddress}{" "}
                </li>
              ))}
              {"\n"}
            </ul>
          </section>
        </div>
      </div>
    );
  }
}
