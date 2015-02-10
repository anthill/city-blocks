'use strict';

/*
    FPS Style
    body mouvement is handled by Z,Q,S,D keys

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
var _getFloorHeight = require('../utils/ray/distanceToFloor.js');

var cos = Math.cos,
    sin = Math.sin,
    pow = Math.pow;

var HEIGHT = 1.8;

var DISTANCE_TO_LOOK_AT = 20;

var PITCH_SPEED = 0.005;
var YAW_SPEED = 0.005;
var BODY_SPEED = 5;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;


module.exports = function(camera, scene, domElement, loadFunctions){

    // 0°) IMPORTANT: loadFunctions is a bundle of functions from city-core
    var getObjectIdsAroundPoint = loadFunctions.getObjectIdsAroundPoint;
    var getObjectIdsFromCameraPosition = loadFunctions.getObjectIdsFromCameraPosition;
    var getObjectIdsAwayFromPoint = loadFunctions.getObjectIdsAwayFromPoint;
    var loadObjects = loadFunctions.loadObjects;
    var hideObjects = loadFunctions.hideObjects;

    // set up some utils from city-blocks
    var getFloorHeight = _getFloorHeight(scene);

    // initialize your personal stuff
    var lookAtPoint;
    var prevTime;
    var deltaPosition = new THREE.Vector3(0,0,0);
    var movementX, movementY;
    var previousDistanceToFloor;

    // Pointerlock activation
    var havePointerLock = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;

    document.body.requestPointerLock = document.body.requestPointerLock ||
        document.body.mozRequestPointerLock ||
        document.body.webkitRequestPointerLock;
    document.body.requestPointerLock();

    // 1°) Camera initial settings
    camera.up = new THREE.Vector3(0, 0, 1);
    camera.near = 1;
    camera.far = 50;
    
    var rayCasterPosition = camera.position;
    rayCasterPosition.z = 10000;
    var distanceToFloor = getFloorHeight(rayCasterPosition);
    // console.log('distance to floor', distanceToFloor, camera.position.z + HEIGHT - distanceToFloor)
    
    prevTime = performance.now();

    // Looking north
    lookAtPoint = new THREE.Vector3( camera.position.x, camera.position.y + DISTANCE_TO_LOOK_AT, camera.position.z )
    camera.lookAt( lookAtPoint );
    updateCamera();
    
    // 2°) Functions to allow camera movement according to user input
    function updateCamera(){

        // delta is for smoothing movement according to framerate performances.
        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        var rayCasterPosition = camera.position;
        rayCasterPosition.z = 10000;
        var distanceToFloor = getFloorHeight(rayCasterPosition);

        // Position camera above the closest floor
        if(distanceToFloor !== undefined){
            camera.position.z += HEIGHT - distanceToFloor;
            if (previousDistanceToFloor !== undefined){
                var deltaHeight = distanceToFloor - previousDistanceToFloor;
                lookAtPoint.z -= deltaHeight;
            }
            else
                lookAtPoint.z -= distanceToFloor;
        }

        deltaPosition.multiplyScalar(BODY_SPEED * delta);

        camera.position.add(deltaPosition);
        lookAtPoint.add(deltaPosition);

        // console.log("Position: x " + camera.position.x + " | y " + camera.position.y + " | z " + camera.position.z);
        // console.log("Direction: x " + camera.direction.x + " | y " + camera.direction.y + " | z " + camera.direction.z);
        // console.log("lookAt Z: " + camera.lookAtVector.z);

        prevTime = time;
        deltaPosition.x = 0;
        deltaPosition.y = 0;
        previousDistanceToFloor = distanceToFloor;

        // See headMovement commentaries
        camera.lookAt(lookAtPoint);
    }

    function headMovement(event) {

        // Get mouse differential movements
        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        // Create pitch axis
        var axis = new THREE.Vector3();
        var camera2Ddirection = projectCameraDirection();
        
        axis.crossVectors(camera2Ddirection, camera.up);

        // Create quaternions for pitch and yaw, then combine them
        var yawQuat = new THREE.Quaternion(0,0,0,1);
        var pitchQuat = new THREE.Quaternion(0,0,0,1);
        var combinedQuat = new THREE.Quaternion(0,0,0,1);

        yawQuat.setFromAxisAngle( camera.up, -movementX * YAW_SPEED);
        pitchQuat.setFromAxisAngle( axis, -movementY * PITCH_SPEED);

        combinedQuat.multiplyQuaternions(yawQuat, pitchQuat);

        // Apply rotation to camera's direction vector
        var direction = new THREE.Vector3(0,0,0);
        direction.subVectors(camera.lookAtVector, camera.position);
        direction.normalize();
        direction.applyQuaternion(combinedQuat);

        // Create new LookAt point
        var newLookAt = new THREE.Vector3(0,0,0);
        newLookAt.addVectors(camera.position, direction);

        lookAtPoint = newLookAt;

        updateCamera();
    }

    function bodyMovement(){
        // t represents the direction to move towards to
        // t is normalized, so that deltaPosition has 'unitary' values
        var t = new THREE.Vector3(0, 0, 0);
        var d = new THREE.Vector3(0, 0, 0);

        var camera2Ddirection = projectCameraDirection();

        t.crossVectors(camera2Ddirection, camera.up);
        d.copy(camera2Ddirection);
        t.normalize();
        d.normalize();

        if (moveForward) deltaPosition.add(d);
        if (moveBackward) deltaPosition.sub(d);
        if (moveLeft) deltaPosition.sub(t);
        if (moveRight) deltaPosition.add(t);

        updateCamera();
    }

    function projectCameraDirection(){
        var direction2D = new THREE.Vector3(0, 0, 0);

        direction2D.x = camera.direction.x;
        direction2D.y = camera.direction.y;

        return direction2D;
    }

    var onKeyDown = function ( event ) {

        switch ( event.keyCode ) {

            case 38: // up
            case 90: // z
                moveForward = true;
                break;

            case 37: // left
            case 81: // q
                moveLeft = true;
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            // case 32: // space
            //     if ( canJump === true ) velocity.y += 350;
            //     canJump = false;
            //     break;
        }

        bodyMovement();
    };

    var onKeyUp = function ( event ) {

        console.log('keypress', event.keyCode);
        switch ( event.keyCode ) {

            case 38: // up
            case 90: // z
                moveForward = false;
                break;

            case 37: // left
            case 81: // q
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };

    // 3°) IMPORTANT: function to load buildings when camera view has changed
    function onCameraViewChangeFirstPerson(){
        var IDs = getObjectIdsFromCameraPosition(camera, 100);
        loadObjects(scene, IDs);
        
        var ObjectToHideIds = getObjectIdsAwayFromPoint(camera.position, 1000);
        hideObjects(scene, ObjectToHideIds);
    }

    // 4°) event listeners to allow camera view changes
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.body.addEventListener("mousemove", headMovement, false);
    camera.on('cameraviewchange', onCameraViewChangeFirstPerson);

    // 5°) IMPORTANT: don't forget to deactivate event listeners
    return function desactivate(){

        document.exitPointerLock = document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;
        document.exitPointerLock();

        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        camera.off('cameraviewchange', onCameraViewChangeFirstPerson);

        document.body.removeEventListener("mousemove", headMovement, false);
        document.exitPointerLock();

    };
    
    
};