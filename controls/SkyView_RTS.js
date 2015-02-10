'use strict';

/*
    * Mouse Move: move camera
    * Scroll up/down: zoom in/out
    
    * Click: center view on building

    * status in this Controls function
    Here you can be "moving", "stopping", "stopped", "scrolling".
    Each has a different policy regarding load buildings policy.
        "moving": load only a small zone
        "stopping": you've just stopped moving, then load a bigger zone
        "stopped": you haven't moved in while, don't load anything
        "scrolling": you zooming in/out, for now has the same behaviour than "stopping"

    *** loadFunctions ***
    This is a set of functions you can use to get buildings from the server into the 3D scene.
    Use the getIDs function to require buildings IDs.
    Use the loadObjects function to actually load the buildings.
    Use the hideObjects function to hide buildings that are too far in the scene
        .getIDsFromPoint(point, distance): imagine a square centered on point, with a side of 2*distance
        .getIDsFromCamera(camera, extra): you get what's inside of the camera view, with a little extra
        .loadObjects(IDs): require buildings IDs from server
        .hideObjects(scene, camera, distance): hide buildings whose distance from camera position is too high
*/

var THREE = require('three');
var _createRay = require('../utils/ray/createRay.js');

// General constants
var SPEED = 1.5;
var MOVING_ZONE_SIZE = 40;

var MIN_Z = 10;
var MAX_Z = 500;

var ZOOM_BY_DELTA = 5;

module.exports = function(camera, scene, domElement, loadFunctions){
    
    // 0°) IMPORTANT: loadFunctions is a bundle of functions from city-core
    var getIDsFromPoint = loadFunctions.getIDsFromPoint;
    var getIDsFromCamera = loadFunctions.getIDsFromCamera;
    var loadObjects = loadFunctions.loadObjects;
    var hideObjects = loadFunctions.hideObjects;

    // set up some utils from city-blocks
    var createRayFromMouse = _createRay(camera).fromMouse;

    // initialize your personal stuff
    var alpha;
    var beta;
    var status = 'stopping';
    var moveAnimationFrame;
    var mousePos;

    // 1°) Camera initial settings
    camera.near = 1;
    camera.far = 5000;

    camera.up = new THREE.Vector3(0, 1, 0);
    camera.lookAt( new THREE.Vector3(camera.position.x, camera.position.y, 0) );
    

    // 2°) Functions to allow camera movement according to user input
    function sign(x) {
        return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
    }

    function moveCamera(){
        camera.position.x = camera.position.x + alpha;
        camera.position.y = camera.position.y + beta;

        moveAnimationFrame = requestAnimationFrame(moveCamera);
    }
    
    function mouseMoveListener(e){

        var canvasBoundingRect = domElement.getBoundingClientRect();

        mousePos = {x: e.clientX, y: e.clientY};

        var deltaX = e.clientX - canvasBoundingRect.width/2;
        var deltaZ = e.clientY - canvasBoundingRect.height/2;

        var thresX = canvasBoundingRect.width/2 - 20;
        var thresZ = canvasBoundingRect.height/2 - 20;

        if(Math.abs(deltaX) > thresX || Math.abs(deltaZ) > thresZ){

            status = 'moving';

            if (Math.abs(deltaX) > thresX){
                alpha = SPEED * sign(deltaX) * camera.position.z/15;
            }
            else {alpha = 0;}

            if (Math.abs(deltaZ) > thresZ){
                beta = - SPEED * sign(deltaZ) * camera.position.z/15;
            }
            else {beta = 0;}

            if(!moveAnimationFrame)
                moveAnimationFrame = requestAnimationFrame(moveCamera)
        }
        else if (status === 'moving'){
            status = 'stopping';
            cancelAnimationFrame(moveAnimationFrame);
            moveAnimationFrame = undefined;
            onCameraViewChangeSky();
        }
    }

    function mouseLeave(){
        alpha = 0;
        beta = 0;

        cancelAnimationFrame(moveAnimationFrame);
        moveAnimationFrame = undefined;
    }

    // hack to normalize deltaY values across browsers.
    var minDeltaY;
    function onScroll(e){
        status = 'scrolling';
        if (minDeltaY > Math.abs(e.deltaY) || !minDeltaY) {
          minDeltaY = Math.abs(e.deltaY);
        }
        
        var deltaY = e.deltaY/minDeltaY;
        
        e.preventDefault();
        var newZ = camera.position.z + deltaY*ZOOM_BY_DELTA;
        camera.position.z = Math.min(Math.max(newZ, MIN_Z), MAX_Z);
    }
    

    // 3°) IMPORTANT: function to load buildings when camera view has changed
    function onCameraViewChangeSky(){
        console.log('Status: ', status);

        if (status === 'moving'){
            var ray = createRayFromMouse(mousePos.x, mousePos.y);
            var point = ray.intersectObjects(scene.children, false)[0].point;

            // Here we use loadFunctions methods to get the IDs of buildings we need, and then actually load them
            var IDs = getIDsFromPoint(point, 40);
            loadObjects(scene, IDs);
        }

        else if (status === 'stopping' || status === 'scrolling'){
            var IDs = getIDsFromCamera(camera, 100);
            loadObjects(scene, IDs);
            hideObjects(scene, camera, 1000);
            status = 'stopped';
        }           
    }
    
    // 4°) event listeners to allow camera view changes
    domElement.addEventListener('wheel', onScroll);
    domElement.addEventListener('mousemove', mouseMoveListener);
    domElement.addEventListener('mouseleave', mouseLeave);
    camera.on('cameraviewchange', onCameraViewChangeSky);


    // 5°) IMPORTANT: don't forget to deactivate event listeners
    return function desactivate(){
        // In Chrome listening to keypress doesn't work for whatever reason
        domElement.removeEventListener('wheel', onScroll);
        domElement.removeEventListener('mousemove', mouseMoveListener);
        domElement.removeEventListener('mouseleave', mouseLeave);
        camera.off('cameraviewchange', onCameraViewChangeSky);
        cancelAnimationFrame(moveAnimationFrame);
        moveAnimationFrame = undefined;
    };

};