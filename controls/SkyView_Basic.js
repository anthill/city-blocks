'use strict';

/*
    * Keys up/down/right/left: move camera
    * Scroll up/down: zoom in/out
*/

var THREE = require('three');

// General constants
var keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
var userPanSpeed = 50.0;

var MIN_Z = 10;
var MAX_Z = 500;

var ZOOM_BY_DELTA = 25;

module.exports = function(camera, scene, domElement, loadObjects){
    
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
        console.log('keypress', event.keyCode);
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
        var L = 2 * camera.position.z * Math.tan(Math.PI*camera.fov/(2*180));
        var l = L * domElement.clientWidth / domElement.clientHeight;

        var south = camera.position.y - L/2;
        var north = camera.position.y + L/2;
        var west = camera.position.x - l/2;
        var east = camera.position.x + l/2;
        
        // ask for a little extra
        west -= 200;
        south -= 200;
        east += 200;
        north += 200;

        loadObjects(scene, south, north, east, west);
    }
    
    
    // 4°) event listeners to allow camera viex changes
    domElement.addEventListener( 'keydown', onKeyDown );
    domElement.addEventListener( 'wheel', onScroll );
    camera.on('cameraviewchange', onCameraViewChangeSky);
        
    // 5°) IMPORTANT: don't forget to deactivate event listeners
    return function desactivate(){
        // In Chrome listening to keypress doesn't work for whatever reason
        domElement.removeEventListener( 'keydown', onKeyDown );
        domElement.removeEventListener( 'wheel', onScroll );
        camera.off('cameraviewchange', onCameraViewChangeSky);
    };
    
};