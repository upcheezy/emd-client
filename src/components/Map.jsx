import React, { Component } from 'react';
import './Map.css';
import mapboxgl from 'mapbox-gl';
import config from '../config'
var MapboxGeocoder = require('@mapbox/mapbox-gl-geocoder');

export default class Map extends Component {
    
    componentDidMount() {
        mapboxgl.accessToken = config.MAPBOX_API_TOKEN
        console.log(config.MAPBOX_API_TOKEN)
        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-79.4512, 43.6568],
            zoom: 13
            });
            map.addControl(
                    new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken,
                    mapboxgl: mapboxgl
                })
            );
    }

    render() {
        return (
            <div id='map'>
            </div>
        )
    }
}
