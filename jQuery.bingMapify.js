/* Fix jsHint failures and naming convention issues*/
/*global $:false */
/*global Microsoft:false */
var XmlHttpRequest = XMLHttpRequest;

/// <summary></summary>
/// <returns></returns>
var mapType = {
    arial: Microsoft.Maps.MapTypeId.arial,
    auto: Microsoft.Maps.MapTypeId.auto,
    birdseye: Microsoft.Maps.MapTypeId.birdseye,
    collinsBart: Microsoft.Maps.MapTypeId.collinsBart,
    mercator: Microsoft.Maps.MapTypeId.mercator,
    ordnanceSurvey: Microsoft.Maps.MapTypeId.ordnanceSurvey,
    road: Microsoft.Maps.MapTypeId.road
};


(function ($) {
    'use strict';

    /// <summary>Replaces each format item in a specified String with the text equivalent of a corresponding object's value.</summary>
    /// <param name="str">The string to be formatted</param>
    /// <param name="collection">The object used to replace each value</param>
    /// <returns>A formatted string</returns>
    /// <remarks>Html is allowed in the str value.</remarks>
    var format = function(str, collection) {
        return str.replace( /\{\{|\}\}|\{(\w+)\}/g , function(m, n) {
            if (m === "{{") {
                return "{";
            }
            if (m === "}}") {
                return "}";
            }
            return collection[n];
        });
    },
    defaults = {
        bingMapCredentials: null,
        mapPins: [{
            lat: '38.685509760012',
            lon: '-96.50390625',
            title: '',
            location: '',
            address: '',
            pinNumber: null
        }],
        mapTypeId: mapType.auto,
        zoom: 10,
        enableClickableLogo: true,
        enableSearchLogo: true,
        showCopyright: true,
        showDashboard: true,
        showLogo: true,
        infoBoxString: '{0}<hr>{1}'
    },
    msMaps = Microsoft.Maps;
    

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function readJsonFromFile(file) {
        var request = new XmlHttpRequest();
        request.open('GET', file, false);
        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        request.send(null);
        try {
            return request.responseText;
        }
        catch (e) {
            return '';
        }
    }

    $.fn.bingMapify = function (config) {
        var settings = $.extend({}, defaults, config),
            map;


        function addPinPoint(mapPin, pinNumber) {
            // kinda silly, but Bing requires us to pass in an object with a 'text' property.
            var badge = { text: pinNumber.toString() };

            var pushpin = new msMaps.Pushpin(new Microsoft.Maps.Location(mapPin.lat, mapPin.lon), badge);

            //extend the pushpin class to store information for popup
            msMaps.Pushpin.prototype.title = null;
            pushpin.title = mapPin.title;
            msMaps.Pushpin.prototype.description = null;
            pushpin.description = format(settings.infoBoxString, mapPin);

            // add the pushpin to the map
            map.entities.push(pushpin);
        }

        function showInfoBox(pinPoint) {
            throw new Error("NotImplementedException");
        }

        function hideInfoBox() {
            throw new Error("NotImplementedException");
        }

        return this.each(function () {
            var i = 0,
                boundries,
                locations = [],
                newMapPins;


            // create a new Microsoft.Map object and set the config
            map = new msMaps.Map(this, {
                credentials: settings.credentials,
                mapTypeId: settings.mapTypeId,
                zoom: settings.zoom,
                enableClickableLogo: settings.enableClickableLogo,
                enableSearchLogo: settings.enableSearchLogo,
                showCopyright: settings.showCopyright,
                showDashboard: settings.showDashboard,
                showLogo: settings.showLogo,
                infoBoxString: settings.infoBoxString
            });


            
            // The user can either manually enter an array of mapPins
            // or send the array from an external file.
            if (isArray(settings.mapPins)) {
                newMapPins = settings.mapPins;
            } else {
                newMapPins = JSON.parse(readJsonFromFile(settings.mapPins));
            }


            $.each(newMapPins, function () {

                // A quick check to see if the user is using capital letters
                // or lower case letters. We can be flexable as long as they're 
                // being consistent.
                if (typeof this.Lat !== 'undefined') {
                    this.lat = this.Lat;
                    this.lon = this.Lon;
                    this.title = this.Title;
                    this.location = this.Location;
                    this.address = this.Address;
                }

                // The locations array can only have the lat and lon portion of the mapPin object.
                locations[i++] = new Microsoft.Maps.Location(this.lat, this.lon);
                addPinPoint(this,i);
            });

            // Bing Maps as the ability to take an array of locations
            // and wrap the map around them appropriately. So first we
            // create a boundries array
            boundries = Microsoft.Maps.LocationRect.fromLocations(locations);

            // Then we set the view of the map based on those boundries
            map.setView({
                bounds: boundries
            });

        });
    };
})(jQuery);