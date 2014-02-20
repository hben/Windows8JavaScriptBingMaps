// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var map;            // Bing Map ojbect
    var currentLocPin;  // Pushpin for current location
    var locationServie; // Location serverice instance 
    var pushpinLayer;   // A layer to contain all pushpins
    var infoboxLayer;   // A layer to contain the infobox
    var resetMapCenter; // Reset the map center location if is true

    document.addEventListener("DOMContentLoaded", initialize, false);

    function initialize() {
        Microsoft.Maps.loadModule('Microsoft.Maps.Map', { callback: initMap });
        Microsoft.Maps.Events.addHandler(map, 'viewchangeend', mapViewChanged);

        btnCurrent.addEventListener("click", currentLocationClick);
        btnSearch.addEventListener("click", searchLocationClick);
        showProgress();
    }

    function initMap() { // Initialize Bing map
        try {
            var mapDiv = document.getElementById("mapDiv");
            var mapOptions = {
                credentials: "xxxxxxxx", // Read from Bing Maps Account
                center: new Microsoft.Maps.Location(43.813, -79.344), // Default to TORONTO
                zoom: 13,
            };
            map = new Microsoft.Maps.Map(mapDiv, mapOptions);

            // layers to maintain the pushpins and infobox popup
            pushpinLayer = new Microsoft.Maps.EntityCollection();
            infoboxLayer = new Microsoft.Maps.EntityCollection();
            map.entities.push(pushpinLayer);
            map.entities.push(infoboxLayer);
        }
        catch (err)  {
            showError("Init Map error", err);
        }
    }

    // Repopulate map when its moved
    function mapViewChanged() {
        resetMapCenter = false;
        if (map.getZoom() > 10) {          
            var mapCenter = map.getCenter();
            var parameters = { lat: mapCenter.latitude, long: mapCenter.longitude };
            searchLocationService(parameters);
        }
    }

    // Search by current location
    function currentLocationClick() { 
        resetMapCenter = true;
        if (!locationServie) {
            locationServie = new MapService.CurrentLocation();
        }
        locationServie.getCurrentLocationAsync().then(
            function (loc) {
                currentLocPin = MapService.getCurrentLocationPushpin(loc);
                searchLocationService({ lat: loc.latitude, long: loc.longitude });
            },
            function (err) {
                showError("Location service error", err);
            });
    }

    // Search servcie by name
    function searchLocationClick() { 
        resetMapCenter = true;
        var searchInput = txtSearch.value;
        if (searchInput) {
            var parameters = { query: escape(searchInput) };
            searchLocationService(parameters);
        }
    }

    // Invoke map service by MapService module
    function searchLocationService(searchParameter) { 
        showProgress();
        try {
            var mapBounds = map.getBounds(); // Map Bounds are only used by mock service
            MapService.invokeLocationService(searchParameter, handleSearchResult, handleSearchError, mapBounds);
        } catch (err) {
            showError("Error occurs", err);
        }
    }

    // Show error message dialog
    function showError(title, err) { 
        var msg =  (err && err.message) ? err.message : err;
        var msgBox = new Windows.UI.Popups.MessageDialog(msg, title);
        msgBox.showAsync();
    }

    // Handle search error
    function handleSearchError(err) {
        showError("Map Service error", err);
        hideProgress();
    }

    // Search Result handling call back
    function handleSearchResult(data) { 
        var serviceLocations = MapService.parseServiceLocations(data);

        if (resetMapCenter) {
            var searchCenter = MapService.parseSearchCenterLocation(data);
            var locations = [];
            for (var i = 0; i < serviceLocations.length; i++) {
                locations.push(serviceLocations[i].location);
            }
            var origCenter = map.getCenter();
            var origBound = map.getBounds();
            var mapBound = Microsoft.Maps.LocationRect.fromLocations(locations);
            map.setView({ center: searchCenter, bounds: mapBound });
        }

        updatePushpins(serviceLocations);

        hideProgress();
    }
    
    // Shwo progress
    function showProgress() {
        progressDiv.style.display = "block";
    }

    // Hide progress
    function hideProgress() {
        progressDiv.style.display = "none";
    }

    // Update pushpins on the map
    function updatePushpins(serviceLocations) { 
        infoboxLayer.clear();
        pushpinLayer.clear();

        for (var i = 0; i < serviceLocations.length; i++) {
            var loc = serviceLocations[i];
            var pin = MapService.getServicePointPushpin(loc);
            pin.name = loc.name;
            pin.summary = loc.summary;
            pushpinLayer.push(pin);
            Microsoft.Maps.Events.addHandler(pin, 'click', showInfobox);
        }

        if (currentLocPin) {
            pushpinLayer.push(currentLocPin);
        }
    }

    // Display infobox when pushpin is clicked
    function showInfobox(e) { 
        if (e.targetType == "pushpin") {
            infoboxLayer.clear();
            var pin = e.target;
            var pinLocation = pin.getLocation();
            var infoboxOptions = {
                showCloseButton: true,
                //offset: new Microsoft.Maps.Point(0, 5),
                showPointer: true,
                zIndex: 10,
                title: pin.name,
                description: pin.summary,
            };

            var infobox = new Microsoft.Maps.Infobox(pinLocation, infoboxOptions);
            infoboxLayer.push(infobox);
        }
    }
})();
