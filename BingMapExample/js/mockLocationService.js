(function () {
    "use strict";

    WinJS.Namespace.define("mockLocationService",
    {
        search: search
    });

    /*
     * Proivde mock data for testing
     * Note: the caculation is based on North America and may not work in other location
     */
    function search(parameters) {
        var response = {};
        response.serviceLocations = [];

        if (parameters.latMin && parameters.latMax && parameters.longMin && parameters.longMax) {
            var latMin = parseFloat(parameters.latMin);
            var latMax = parseFloat(parameters.latMax);
            var longMin = parseFloat(parameters.longMin);
            var longMax = parseFloat(parameters.longMax);

            // recenter the map if search by location
            if (parameters.lat && parameters.long) {
                latMin = parameters.lat - (latMax - latMin) / 2;
                latMax = parameters.lat + (latMax - latMin) / 2;
                longMin = parameters.long - (longMax - longMin) / 2;
                longMax = parameters.long + (longMax - longMin) / 2;
            }

            // generate 10-20 mock service loacations 
            var count = 10 + Math.floor(Math.random() * 10);
            var mockData = generateMockData(latMin, latMax, longMin, longMax, count);
            for (var i = 0; i < mockData.length; i++) {
                var serviceLocation = mockData[i];
                response.serviceLocations.push(serviceLocation)
            }

            // also return a center location for mapping
            response.center = { lat: ((latMax + latMin) / 2), long: ((longMin + longMax) / 2) };
        }
        return response;
    }

    function generateMockData(latMin, latMax, longMin, longMax, count)
    {
        var services = [];
        for (var i = 1; i <= count; i++) {
            var lat = Math.random() * (latMax - latMin) + latMin;
            var long = Math.random() * (longMax - longMin) + longMin;
            var name = "Service location " + i;
            var address = i + " Queen street ...";
            var rand = Math.floor(Math.random() * 5) + 1;
            var type, address, description;
            switch (rand) {
                case 1:
                    type = MapService.ServcieType.Restaurant;
                    description = "Come and taste our famous dishes ...";
                    break;
                case 2:
                    type = MapService.ServcieType.Vegetarian;
                    description = "Looking for healthy vete food? ...";
                    break;
                case 3:
                    type = MapService.ServcieType.Buffet;
                    description = "No idea what to eat? ...";
                    break;
                case 4:
                    type = MapService.ServcieType.Bar;
                    description = "Have a few beers and other drinks here ...";
                    break;
                case 5:
                    type = MapService.ServcieType.Foodtruck;
                    description = "Call us and we will bring your our nice food ...";
                    break;
            }
            var servicePoint = { name: name, lat: lat, long: long, type: type, address: address, description: description };
            services.push(servicePoint);
        }
        return services;
    }

})();