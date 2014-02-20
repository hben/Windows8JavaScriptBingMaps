(function () {
    "use strict";

    // Service types for mock service
    var ServcieType = { Restaurant: 1, Vegetarian: 2, Buffet: 3, Bar: 4, Foodtruck: 5 };

    function invokeLocationService(searchParameter, callBack, errorHandler, mapBounds) {
        if (!mapBounds) { // Get data from web service
            var searchUrl = "http://mylocationserver.com/search";
            WinJS.xhr({ url: searchUrl, data: searchParameter, responseType: "json" }).done(
                function (result) { // Service call completed
                    if (callBack) {
                        var data = JSON.parse(result.responseText);
                        callBack(data);
                    }
                },
                function (err) { // Service call error
                    if (errorHandler) {
                        errorHandler(err);
                    }
                });
        } else { // Get data from mock service
            if (callBack) {
                try {
                    // mapBounds values in north America, maynot work in other location
                    var latMin = mapBounds.getSouth();
                    var latMax = mapBounds.getNorth();
                    var longMin = mapBounds.getWest();
                    var longMax = mapBounds.getEast();
                    var parameters = { latMin: latMin, latMax: latMax, longMin: longMin, longMax: longMax };

                    if (searchParameter.lat && searchParameter.long) { // Search by location
                        parameters.lat = searchParameter.lat;
                        parameters.long = searchParameter.long;
                    } else { // Search by name
                        parameters.query = searchParameter.query;
                    }
                    var serviceLocations = mockLocationService.search(parameters);
                    callBack(serviceLocations);
                } catch (ex) {
                    if (errorHandler) {
                        errorHandler(ex);
                    }
                }   
            }
        }
    }

    // parse result JSON and return an array of service locaiton objects
    function parseServiceLocations(json) { 
        var serviceLocations = [];      
        for (var i = 0; i < json.serviceLocations.length; i++) {
            var service = json.serviceLocations[i];
            var newLocation = {};
            newLocation.location = new Microsoft.Maps.Location(service.lat, service.long);
            newLocation.name = service.name;
            newLocation.summary = service.description + "<br /><br /><b>Address: </b>" + service.address;
            newLocation.type = service.type;
            populateImageUrls(newLocation);
            serviceLocations.push(newLocation);
        }
        return serviceLocations;
    }

    // parse center location from result JSON
    function parseSearchCenterLocation(data) { 
        return new Microsoft.Maps.Location(data.center.lat, data.center.long);
    }

    // Populate pushpin and location image urls
    function populateImageUrls(serviceLocation) { 
        switch (serviceLocation.type) {
            case ServcieType.Restaurant:
                serviceLocation.pushpinUrl = "images/locationIcons/restaurant.png";
                break;
            case ServcieType.Vegetarian:
                serviceLocation.pushpinUrl = "images/locationIcons/vegetarian.png";
                break;
            case ServcieType.Buffet:
                serviceLocation.pushpinUrl = "images/locationIcons/buffet.png";
                break;
            case ServcieType.Bar:
                serviceLocation.pushpinUrl = "images/locationIcons/bar.png";
                break;
            case ServcieType.Foodtruck:
                serviceLocation.pushpinUrl = "images/locationIcons/foodtruck.png";
                break;
        }
    }

    // create a pushpin for a service location object
    function getServicePointPushpin(serviceLocation) {
        var pushpin = new Microsoft.Maps.Pushpin(serviceLocation.location,
                {
                    icon: serviceLocation.pushpinUrl,
                    width: 32,
                    height: 37,
                    anchor: new Microsoft.Maps.Point(16, 18)
                });
        pushpin.name = serviceLocation.name;
        pushpin.summary = serviceLocation.summary;
        return pushpin;
    }

    // create a pushpin for current location
    function getCurrentLocationPushpin (location) {
        var pushpin = new Microsoft.Maps.Pushpin(location,
                {
                    icon: "/images/locationIcons/current.png",
                    width: 32, height: 37,
                    anchor: new Microsoft.Maps.Point(16, 18)
                });
        pushpin.name = "Your current location";
        pushpin.summary = "latitude: " + location.latitude + " longitude:" + location.longitude;
        return pushpin;
    }

    // Location service helper
    var CurrentLocation = WinJS.Class.define(
        // Constructor
        function (disableCache) {
            this.doCache = !disableCache;
        },
        // Instance members
        {
            getCurrentLocationAsync: function () {
                var self = this;
                return new WinJS.Promise(function (c, e, p) {
                    if (CurrentLocation.geoLocator == null) {
                        CurrentLocation.geoLocator = new Windows.Devices.Geolocation.Geolocator();
                    }
                    if (CurrentLocation.geoLocator) {
                        if (self.doCache && CurrentLocation.location) {
                            c(CurrentLocation.location); // complete the call back with cached data
                        } else {
                            return CurrentLocation.geoLocator.getGeopositionAsync().then(
                                function (pos) { // get position data handler
                                    var loc = new Microsoft.Maps.Location(pos.coordinate.latitude, pos.coordinate.longitude);
                                    CurrentLocation.location = loc; // Cache local position
                                    c(loc);
                                }.bind(this),
                                function (ex) { // location service error
                                    e(ex);
                                }.bind(this));
                        }
                    }
                });
            }
        },
        // Static members
        { 
            geoLocator: null,
            location: null
        }
    );

    // Expose MapService
    WinJS.Namespace.define("MapService",
    {
        ServcieType: ServcieType,
        CurrentLocation: CurrentLocation,
        invokeLocationService: invokeLocationService,
        parseServiceLocations: parseServiceLocations,
        parseSearchCenterLocation: parseSearchCenterLocation,
        getServicePointPushpin: getServicePointPushpin,
        getCurrentLocationPushpin: getCurrentLocationPushpin,
    });

})();