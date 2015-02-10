'use strict';

var THREE = require('three');

module.exports = function(camera){

    function fromMouse(mousePosition){
        console.log('creating ray from mouse');
        // event ca be a mousemove or click
        var projector = new THREE.Projector();
        
        // Get the mouse X and Y screen positions, and scale them to [-1, 1] ranges, position (-1, 1) being the upper left side of the screen.
        var x = (mousePosition.x / window.innerWidth) * 2 - 1;
        var y = - (mousePosition.y / window.innerHeight) * 2 + 1;
        
        // Create Vector3 from mouse position, with Z = 0
        var mousePos = new THREE.Vector3(x, y, 0);

        // Create a picking-specific RayCaster from Three.js library 
        return projector.pickingRay(mousePos, camera);
    }

    function fromView(){
        console.log('creating ray from view');
        return new THREE.Raycaster( camera.position, camera.direction);
    }

    function fromPoint(point, direction){
        console.log('creating ray from point and direction');
        // point and direction are THREE.Vector3
        return new THREE.Raycaster(point, direction);
    }
    
    return {
        fromMouse: fromMouse,
        fromView: fromView,
        fromPoint: fromPoint
    };
}

