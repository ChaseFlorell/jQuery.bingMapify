/* Fix jsHint failures and naming convention issues*/
/*global $:false */
/*global Microsoft:false */
var XmlHttpRequest = XMLHttpRequest;

/// <summary>creates a local enum of the Microsoft MapTypeId's</summary>
/// <returns> Microsoft.Maps.MapTypeId item.</returns>
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
        

    /// <summary>Default settings for the generated map</summary>
    defaults = {
        
        /// <summary>Required credentials in order to use Bing Maps</summary>
        bingMapCredentials: null,
        
        /// <summary>An array of fields used to generate map pins</summary>
        mapPins: [{
            lat: '38.685509760012',
            lon: '-96.50390625',
            title: '',
            location: '',
            address: '',
            pinNumber: null
        }],
        
        /// <summary>Select the view you wish to use using the mapType enum</summary>
        mapTypeId: mapType.auto,
        
        /// <summary>Default map zoom level</summary>
        zoom: 10,
        enableClickableLogo: true,
        enableSearchLogo: true,
        showCopyright: true,
        showDashboard: true,
        showLogo: true,
        
        /// <summary>Pin description used in the Info Box</summary>
        infoBox: {
            enabled: true,
            formatHtmlContent: '<div class="infoBox"><h1>{title}</h1><hr>{location}<br>{address}</div>',
            visibleOnLoad: false
        }
    },
        
    /// <summary>Create a local instance of Microsoft.Maps</summary>
    msMaps = Microsoft.Maps;
    

    /// <summary>Check if the passed in object is an Array</summary>
    /// <param name="input">Object to check</param>
    /// <returns>Boolean</returns>
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }


    /// <summary>Read JSON from an external source</summary>
    /// <param name="file">File to read</param>
    /// <returns>Array</returns>
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
        var settings = $.extend({ }, defaults, config),
            map = null,
            pinInfoBox = null;

        /// <summary>Add a single map pin to the map</summary>
        /// <param name="mapPin">Map pin information - includes lat, lon, title, address, and location</param>
        /// <param name="pinNumber">Number used on the pin badge</param>
        function addPinPoint(mapPin, pinNumber) {
            var infoBoxOptions, 
                pushPin = new msMaps.Pushpin(new Microsoft.Maps.Location(mapPin.lat, mapPin.lon), { text: pinNumber.toString() });
            
           if(settings.infoBox.enabled) {
               infoBoxOptions = {
                   htmlContent: format(settings.infoBox.formatHtmlContent, mapPin),
                   visible: settings.infoBox.visibleOnLoad
               };

                pinInfoBox = new Microsoft.Maps.Infobox(new Microsoft.Maps.Location(mapPin.lat, mapPin.lon), infoBoxOptions);
               
                Microsoft.Maps.Events.addHandler(map, 'click', hideInfoBoxHandler);
                Microsoft.Maps.Events.addHandler(pushPin, 'click', showInfoBoxHandler);
                
           }

            // add the pushpin to the map
            map.entities.push(pushPin);
            map.entities.push(pinInfoBox);
        }


        /// <summary>Event Handler used to show the infoBox</summary>
        function showInfoBoxHandler(e) {
            if(e.targetType === "pushpin") {
                
                pinInfoBox.setOptions({ visible: true, offset: new Microsoft.Maps.Point(-10, 25) });
                pinInfoBox.setLocation(e.target.getLocation());



                //A buffer limit to use to specify the infobox must be away from the edges of the map.
                var buffer = 25;

                var infoboxOffset = pinInfoBox.getOffset();
                var infoboxAnchor = pinInfoBox.getAnchor();
                var infoboxLocation = map.tryLocationToPixel(e.target.getLocation(), Microsoft.Maps.PixelReference.control);

                var dx = infoboxLocation.x + infoboxOffset.x - infoboxAnchor.x;
                var dy = infoboxLocation.y - 25 - infoboxAnchor.y;

                if (dy < buffer) { //Infobox overlaps with top of map.
                    //Offset in opposite direction.
                    dy *= -1;

                    //add buffer from the top edge of the map.
                    dy += buffer;
                } else {
                    //If dy is greater than zero than it does not overlap.
                    dy = 0;
                }

                if (dx < buffer) { //Check to see if overlapping with left side of map.
                    //Offset in opposite direction.
                    dx *= -1;

                    //add a buffer from the left edge of the map.
                    dx += buffer;
                } else { //Check to see if overlapping with right side of map.
                    dx = map.getWidth() - infoboxLocation.x + infoboxAnchor.x - pinInfoBox.getWidth();

                    //If dx is greater than zero then it does not overlap.
                    if (dx > buffer) {
                        dx = 0;
                    } else {
                        //add a buffer from the right edge of the map.
                        dx -= buffer;
                    }
                }

                //Adjust the map so infobox is in view
                if (dx !== 0 || dy !== 0) {
                    map.setView({ centerOffset: new Microsoft.Maps.Point(dx, dy), center: map.getCenter() });
                }
            }
        }

        /// <summary>Event handler to hide the infoBox</summary>
        function hideInfoBoxHandler(e) {
            pinInfoBox.setOptions({ visible: false });
        }


        /// <summary>Initialize the plugin and return a map to the view</summary>
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


            /// <summary>Loop through the mapPins and drop them on the map</summary>
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
