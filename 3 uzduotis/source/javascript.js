$(function () {
	var scene = new THREE.Scene();
	var renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color(0xffffff));
	renderer.setSize(window.innerWidth, window.innerHeight);
	
	// Pridedame kamerą
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.x = -150;
	camera.position.y = 150;
	camera.position.z = -100;
	camera.lookAt(scene.position);
	
	// Kamera yra Orbit, kad galimėtų žiūrėti į objektą iš skirtingų perspektyvų
	var cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	
	// Nustatome objekto nustatymus
	var settings = {
		"Laiptu kiekis": 20,
        "Posukio asies ilgis": 25,
        "Laiptu kampas": 180
      };
	var STAIRS_COUNT = 20;
	var STAIR_RADIUS_SIZE = 25;
	var STAIR_ANGLE = 180;
	var gui = new dat.GUI();
	gui.add(settings, 'Laiptu kiekis', 0, 50).listen().onFinishChange(() => {render()});
	gui.add(settings, 'Posukio asies ilgis', 0, 50).listen().onFinishChange(() => {render()});
	gui.add(settings, 'Laiptu kampas', 0, 360).listen().onFinishChange(() => {render()});

	render();

	function render() {
		STAIRS_COUNT = settings["Laiptu kiekis"];
		STAIR_RADIUS_SIZE = settings["Posukio asies ilgis"];
		STAIR_ANGLE = settings["Laiptu kampas"];

		// Naudojame sąrašą, kad vėliau sujungtume sukurtus elementus
		var stairs_list = [];
		
		removeSceneObjects();
		addLights();

		// sukuriam pirmą laiptelį
		var stair = createFirstStair();
			
		var secondStair = stair.clone();
		secondStair.position.x += 20;
		secondStair.rotation.y += -1 * Math.PI;
		secondStair.position.y += 1;
	
		addStairDown(stair, secondStair);
		addHandrailPill(stair, secondStair);
		
		//Nustatom laiptelių pradinį aukštį
		stair.position.y = 49;
		secondStair.position.y = 50;
		
		var rotation = STAIR_ANGLE / 180 / STAIRS_COUNT * Math.PI;

		var axis = createAxis();
		
		//Pridedam pirmą laiptelį
		var clone = stair.clone();
		stairs_list.push(clone);
		scene.add(clone);
		
		//Sumažiname laiptelio aukštį
		secondStair.position.y -= 50/STAIRS_COUNT; 
		stair.position.y -= 50/STAIRS_COUNT;
		
		addStairs(stair, secondStair, stairs_list, rotation, axis);

		stairsConnection(stairs_list);
		addHandrailPillsConnection(stairs_list);
		createFirstFloor();
		createSeconfFloor();
		update();
	}
	
	function update() {
		$("#WebGL-output").append(renderer.domElement);
		requestAnimationFrame(render);
		cameraControls.update(); 
		renderer.render(scene, camera);
	}
	
	function createFirstStair() {
		var stairMesh = createStraiMesh();
		// Rotuojame laiptelį
		stairMesh.rotation.x = Math.PI / -2;
		stairMesh.position.x += 4.7;
		stairMesh.position.y += 1;
		return stairMesh;
	}
	
	function drawStair(width, height){
		var shape = new THREE.Shape();
		
		// Kursorių judinama iki šoninio centro
		shape.moveTo( 0, -width/2 );
		// Braižome užpildytą figūrą
		shape.lineTo( 0, width/2 );
		shape.lineTo( height, width/2 );
		shape.lineTo( height, width/2);
		shape.lineTo( height, -width/2);

		return shape;
	}
	
	function removeSceneObjects() {
		for( var i = scene.children.length - 1; i >= 0; i--) { 
			obj = scene.children[i];
			scene.remove(obj); 
		}
	}
	
	function addLights() {
		const light = new THREE.AmbientLight( 0x242424, 3 );
		scene.add(light);
		
		const spotLight = new THREE.SpotLight( 0xffffff);
		spotLight.position.set( -40, 60, -10 );
		spotLight.angle = Math.PI/3;
		spotLight.castShadow = true;
		scene.add(spotLight);
	}
	
	function addStairDown(stair, secondStair) {
		// Sukuriame laiptelio apačią
		var stairDownGeometry = new THREE.BoxGeometry(2, 2, 50/STAIRS_COUNT + 1);
		//new THREE.BoxGeometry(2, 2, 6);
		
		var stairDownMaterial = new THREE.MeshLambertMaterial({color: 0x5a5a5a});
		var stairDown = new THREE.Mesh(stairDownGeometry, stairDownMaterial);
		var centerVector = getCenterVector(stair);
		stairDown.position.add(centerVector);
		stairDown.position.y -= (50/STAIRS_COUNT + 1)/2
		stairDown.rotateX( Math.PI / 2 );
		stair.attach(stairDown.clone());
		secondStair.attach(stairDown);
	}
	
	function getCenterVector(stair) {
		var center = new THREE.Vector3();
		var geometry = stair.geometry;

		// Apskaičiuojame matmenis
		geometry.computeBoundingBox();

		// Apskaičiuojame vidurio reikšmes, tai bus centras
		center.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
		center.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
		center.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;

		return center;
	}
	
	function addHandrailPill(stair, secondStair) {
		// Sukuriame turėklo stovą
		//var handrailGeometry = new THREE.CylinderGeometry(1, 1, 20, 3 );
		var handrailGeometry = new THREE.BoxGeometry(1.5, 1.5, 20);
		var handrailMaterial = new THREE.MeshLambertMaterial({color: 0x5a5a5a});
		var handrail = new THREE.Mesh(handrailGeometry, handrailMaterial);
		handrail.position.x -= 1;
		handrail.position.y += 8
		handrail.rotateX( Math.PI / 2 );
		stair.attach(handrail.clone());
		secondStair.attach(handrail);
	}
	
	function createAxis() {
		var axis = new THREE.Group();
		axis.position.x -= STAIR_RADIUS_SIZE;
		return axis;
	}
	
	function addStairs(stair, secondStair, stairs_list, rotation, axis) {
		for (var i = 1; i < STAIRS_COUNT ; i++) {
			stairClone = stair.clone();
			axis.add(stairClone);
			// Normalizuojame laiptelį, kad atitiktų posukį
			stairClone.position.sub(axis.position);
			axis.rotateY(rotation);
			scene.attach(stairClone);
			scene.add(stairClone);
			stairs_list.push(stairClone);
			
			//Numažinam laiptelių aukštį
			secondStair.position.y -= 50/STAIRS_COUNT;
			stair.position.y -= 50/STAIRS_COUNT;
		}
	}
	
	function stairsConnection(stairs_list) {
		for (var i = 0; i < STAIRS_COUNT - 1 ; i++) {
			// Sukuriame vektorių per vidurį laiptelio
			var startVector = new THREE.Vector3(0,0,0);
			stairs_list[i].children[0].getWorldPosition(startVector);
			startVector.y -= (50/STAIRS_COUNT + 1 + 2) / 2;
			
			var endVector = new THREE.Vector3(0,0,0);
			stairs_list[i + 1].children[0].getWorldPosition(endVector);
			endVector.y += (50/STAIRS_COUNT ) / 2;
			
			var betweenVector = endVector.clone();
			betweenVector.sub(startVector);

			var length = startVector.distanceTo(endVector);

			// Sukuriame sujungimą
			var connectionGeometry = new THREE.BoxGeometry(2, 2, length);
			var connectionMaterial = new THREE.MeshLambertMaterial({color: 0x5a5a5a});
			var connectionMesh = new THREE.Mesh(connectionGeometry, connectionMaterial );
			connectionMesh.position.add(startVector);
			connectionMesh.position.z -= length/2 - 1;
			
			// Pasukame sujungimą 
			var connectionAxis = new THREE.Group();
			connectionAxis.position.add(startVector.clone());
			connectionAxis.attach(connectionMesh);
			var connectionMoving = new THREE.Vector3(0,0,-1).angleTo(betweenVector.clone());
			if (betweenVector.x > 0) {
				connectionMoving = -connectionMoving;
			};
			connectionAxis.rotateY(connectionMoving);
			scene.attach(connectionMesh);
			
			//Pridedame sujungimą
			scene.add(connectionMesh);
		}
	}
	
	function addHandrailPillsConnection(stairs_list) {
		var topPoints = [];
		for (var i = 0; i < STAIRS_COUNT ; i++) {
			var position = new THREE.Vector3(0,0,0);
			stairs_list[i].children[1].getWorldPosition(position);
			position.y += 10;
			topPoints.push(position);
		}
			
		var stairDownMaterial = new THREE.MeshLambertMaterial({color: 0x5a5a5a});
		const curve = new THREE.SplineCurve3(topPoints);
		const tubeGeometry = new THREE.TubeGeometry(curve);
		var tube = new THREE.Mesh( tubeGeometry, stairDownMaterial );
		scene.add(tube);
	}
	
	function createFirstFloor() {
		var floorGeometry = new THREE.PlaneGeometry(300, 300);
		var floorMaterial = new THREE.MeshLambertMaterial({color: 0xfafafa});
		var floor = new THREE.Mesh(floorGeometry, floorMaterial) ;
		floor.rotation.x = -0.5 * Math.PI;
		
		scene.add(floor);
	}
	
	function createSeconfFloor() {
		var floorMaterial = new THREE.MeshLambertMaterial({color: 0xfafafa});
		floorGeometry = new THREE.PlaneGeometry(30, 30);
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.rotation.x = -0.5 * Math.PI;
		floor.position.set(10, 50.5, 20);
		scene.add(floor);
	}
	
	function createStraiMesh() {
	    var radius = 5;
	    //var material = new THREE.MeshNormalMaterial();
		var material = new THREE.MeshLambertMaterial({color: 0xDEB887});

	    point1 = new THREE.Vector3(0, 0, 0);
	    point2 = new THREE.Vector3(15, 0, 0);
	    point3 = new THREE.Vector3(15, 2, 0);
		point4 = new THREE.Vector3(0, 2, 0);

	    p = point3.clone().sub(point2);
	    a1 = Math.atan2(p.y, p.x) + Math.PI / 2;

	    p = point2.clone().sub(point1);
	    a2 = Math.atan2(p.y, p.x) - Math.PI / 2;

	    p = point1.clone().sub(point2);
	    a3 = Math.atan2(p.y, p.x) + Math.PI / 2;

	    p = point3.clone().sub(point2);
	    a4 = Math.atan2(p.y, p.x) - Math.PI / 2;
      
		p = point4.clone().sub(point3);
	    a5 = Math.atan2(p.y, p.x) - Math.PI / 2;
      

	    path = new THREE.Path();

	    path.absarc(point1.x, point1.y, radius, a1, a2, false);
	    path.absarc(point2.x, point2.y, radius, a3, a4, false);
	    path.absarc(point3.x, point3.y, radius, a4, a5, false);
		path.absarc(point4.x, point4.y, radius, a5, a1, false);
       

	    var points = path.getSpacedPoints( 100 );

	    var shape = new THREE.Shape( points );
        
	    var geometry = new THREE.ExtrudeGeometry(shape, {
	        amount: 1,
	        bevelEnabled: false
	    });
		return new THREE.Mesh(geometry, material);
	}
	
	function createStairWithoutRadius() {
		// Laipteris yra 20 ilgio ir 10 pločio
		const length = 20, width = 10;
		var smoothness = 1;
		var radius = 60;
		var depth = 1;
		const extrudeSettings = {
			steps: 1,
			bevelEnabled: true,
			depth: 1,
			curveSegments: 8,
			bevelThickness: 0.5,
			bevelSize: 0.05,
			bevelOffset: 0,
			bevelSegments: 1
		};
		const extrudeGeometry = new THREE.ExtrudeGeometry(drawStair(width, length ), extrudeSettings);
		// Nustatome laiptelio spalvą
		var stairMaterial = new THREE.MeshLambertMaterial({color: 0xDEB887});
		return new THREE.Mesh(extrudeGeometry, stairMaterial) ;
	}
});


