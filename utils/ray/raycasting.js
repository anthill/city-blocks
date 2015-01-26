'use strict';

var THREE = require('three');

module.exports = function(camera, scene, domElement){

	var ray = new THREE.Raycaster(),
	    projector = new THREE.Projector();

	var mouse = {
		x: 0,
		y: 0
	};

	var old;

	function onClick(event){
	    
		// Get the mouse X and Y screen positions, and scale them to [-1, 1] ranges, position (-1, 1) being the upper left side of the screen.
	    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
	    
	    // Create Vector3 from mouse position, with Z = 0
	    var mousePos = new THREE.Vector3(mouse.x, mouse.y, 0);

	    // Create a picking-specific RayCaster from Three.js library 
	    ray = projector.pickingRay(mousePos, camera);

	    // Get the list of all scene children intersected by Raycaster
	    var out = ray.intersectObjects(scene.children, false);

	}

	domElement.addEventListener( 'click', onClick );
	
}