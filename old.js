var UrbanNow = UrbanNow || {};
UrbanNow.BingMap = {
    BingMapCredentials: 'AuBa16dlDXhdzNoBt3ormvmRIA9qYFnoEuHlxEpcS4euFmnLMDokdL5RVCMSUAKZ',
    map: null,
    MSMaps: Microsoft.Maps,
    init: function () {
        map = new this.MSMaps.Map(document.getElementById('bingMap'), {
            credentials: this.BingMapCredentials,
            mapTypeId: Microsoft.Maps.MapTypeId.auto,
            zoom: 10,
            enableClickableLogo: false,
            enableSearchLogo: false,
            showCopyright: false,
            showDashboard: true,
            showLogo: false
        });
    },
    AddPinPoint: function (lat, lon, title, location, address, pinId) {
        var badge = {
            text: pinId.toString()
        };
        var pinLocation = new Microsoft.Maps.Location(lat, lon);

        var pushpin = new this.MSMaps.Pushpin(pinLocation, badge);

        //extend the pushpin class to store information for popup
        this.MSMaps.Pushpin.prototype.title = null;
        pushpin.title = title;
        this.MSMaps.Pushpin.prototype.description = null;
        pushpin.description = location + '<br />' + address + '<br />lat: ' + lat + ' &nbsp; lon: ' + lon;

        map.entities.push(pushpin);
    },
    showInfoBox: function (e) {
        // Not yet implemented
    },
    hideInfoBox: function () {
        // Not yet implemented
    }
};

$(document).ready(function () {
    // Load the Bing Map and populate it
    var increment = 0; // used to increment event locations
    var locations = new Array();

    // Load the initial map
    UrbanNow.BingMap.init();

    // loop through all events and place a point on the map
    $.each(json_object, function () {
        locations[increment++] = new Microsoft.Maps.Location(this.Lat, this.Lon);
        UrbanNow.BingMap.AddPinPoint(this.Lat, this.Lon, this.Title, this.Location, this.Address, increment);
    });

    var viewRect = Microsoft.Maps.LocationRect.fromLocations(locations);

    map.setView({
        bounds: viewRect
    });
});




