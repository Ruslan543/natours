/* eslint-disable */

export const displayMap = function (locations) {
  mapboxgl.accessToken =
    "pk.eyJ1IjoicnVzbGFuMTgzIiwiYSI6ImNsZ2FtcGN4bzFqNGEzdXBkcnR6YjhuaHIifQ.89-6vkpPvj_0Yo2_7QF91w";

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/ruslan183/clgbdadxf000701mhpcr9dnz2",
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((location) => {
    // Create marker
    const element = document.createElement("div");
    element.className = "marker";

    // Add marker
    new mapboxgl.Marker({
      element,
      anchor: "bottom",
    })
      .setLngLat(location.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(location.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
