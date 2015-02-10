'use strict';

/*
    * Keys up/down/right/left: move camera
    * Scroll up/down: zoom in/out

    *** loadFunctions ***
    This is a set of functions you can use to get buildings from the server into the 3D scene.
    Use the getIDs function to require buildings IDs.
    Use the loadObjects function to actually load the buildings.
    Use the hideObjects function to hide buildings that are too far in the scene
        .getObjectIdsAroundPoint(point, distance): imagine a square centered on point, with a side of 2*distance
        .getObjectIdsFromCameraPosition(camera, extra): you get objects around camera position, with a little extra
        .getObjectIdsAwayFromPoint(point, distance): you get objects further than distance from position
        .loadObjects(IDs): require buildings IDs from server
        .hideObjects(scene, camera, distance): hide buildings whose distance from camera position is too high
*/

var THREE = require('three');

// General constants
var keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
var userPanSpeed = 50.0;

var MIN_Z = 10;
var MAX_Z = 500;

var ZOOM_BY_DELTA = 25;

module.exports = function(camera, scene, domElement, loadFunctions){

    // 0°) IMPORTANT: loadFunctions is a bundle of functions from city-core
    var getObjectIdsFromCameraPosition = loadFunctions.getObjectIdsFromCameraPosition;
    var getObjectIdsAwayFromPoint = loadFunctions.getObjectIdsAwayFromPoint;
    var loadObjects = loadFunctions.loadObjects;
    var hideObjects = loadFunctions.hideObjects;
    
    // 1°) Camera initial settings
    camera.near = 1;
    camera.far = 5000;

    camera.up = new THREE.Vector3(0, 1, 0);

    camera.lookAt( new THREE.Vector3( camera.position.x, camera.position.y, 0 ) );

    // 2°) Functions to allow camera movement according to user input
    function pan ( direction ) {
        var camx = camera.position.x + direction.x*userPanSpeed;
        var camy = camera.position.y + direction.y*userPanSpeed;
        camera.position.x = camx;
        camera.position.y = camy;

        camera.lookAt( new THREE.Vector3( camx, camy, 0 ) );
    };

    function onKeyDown( event ) {
        // console.log('keypress', event.keyCode);
        switch ( event.keyCode ) {
            case keys.UP:
                pan( new THREE.Vector3( 0, 1, 0 ) );
                event.preventDefault();
                break;
            case keys.BOTTOM:
                pan( new THREE.Vector3( 0, - 1, 0 ) );
                event.preventDefault();
                break;
            case keys.LEFT:
                pan( new THREE.Vector3( - 1, 0, 0 ) );
                event.preventDefault();
                break;
            case keys.RIGHT:
                pan( new THREE.Vector3( 1, 0, 0 ) );
                event.preventDefault();
                break;
        }
    }
    
    // hack to normalize deltaY values across browsers.
    var minDeltaY;
    function onScroll(e){
        if (minDeltaY > Math.abs(e.deltaY) || !minDeltaY) {
          minDeltaY = Math.abs(e.deltaY);
        }
        
        var deltaY = e.deltaY/minDeltaY;
        
        e.preventDefault();
        var newZ = camera.position.z + deltaY*ZOOM_BY_DELTA;
        camera.position.z = Math.min(Math.max(newZ, MIN_Z), MAX_Z);
        // TODO send a ray in mouse direction and move camera.position.x/y in this direction
    }
    
    // 3°) IMPORTANT: function to load buildings when camera view has changed
    function onCameraViewChangeSky(){
        var IDs = getObjectIdsFromCameraPosition(camera, 100);
        loadObjects(scene, IDs);

        var ObjectToHideIds = getObjectIdsAwayFromPoint(camera.position, 1000);
        hideObjects(scene, ObjectToHideIds);
    }
    
    
    // 4°) event listeners to allow camera view changes
    window.addEventListener('keydown', onKeyDown);
    domElement.addEventListener('wheel', onScroll);
    camera.on('cameraviewchange', onCameraViewChangeSky);
        
    // 5°) IMPORTANT: don't forget to deactivate event listeners
    return function desactivate(){
        // In Chrome listening to keypress doesn't work for whatever reason
        window.removeEventListener('keydown', onKeyDown);
        domElement.removeEventListener('wheel', onScroll);
        camera.off('cameraviewchange', onCameraViewChangeSky);
    };
    
};