$(function () {
	var scene = new THREE.Scene();
	var renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color(0xffffff));
	renderer.setSize(window.innerWidth, window.innerHeight);
	
	// Pridedame kamerą
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(150, 100, 0);
	camera.lookAt(scene.position);
	
	// Kamera yra Orbit, kad galimėtų žiūrėti į objektą iš skirtingų perspektyvų
	var cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	
	// Nustatome objekto nustatymus
	var settings = {
		"Spindulys": 20,
        "Aukstis": 25,
        "Tasku kiekis": 180,
		"Kvadratu dydis": 5
      };
	var R = 20; //Spindulys
	var H = 25; // Aukštis
	var POINTS_COUNT = 180; // Taškų kiekis
	var gui = new dat.GUI();
	gui.add(settings, 'Spindulys', 0, 50).listen().onFinishChange(() => {render()});
	gui.add(settings, 'Aukstis', 0, 50).listen().onFinishChange(() => {render()});
	gui.add(settings, 'Tasku kiekis', 0, 2000).listen().onFinishChange(() => {render()});
	gui.add(settings, 'Kvadratu dydis', 0, 20).listen().onFinishChange(() => {render()});

	render();

	function render() {
		R = settings["Spindulys"];
		H = settings["Aukstis"];
		POINTS_COUNT = settings["Tasku kiekis"];

		removeSceneObjects();
		addLights();

		var points = [];
		while(points.length < POINTS_COUNT) {
			var x = (Math.random()* 2 - 1) * R; 
			var z = (Math.random()* 2 - 1) * R;
			var y = (Math.random()* 2 - 1) * H/2; // priesingai negu spindulys, aukstis yra visa figuros dalis, todel reikia padalinti is 2
			if (Math.pow(x,2) + Math.pow(z,2) <= Math.pow(R,2)/Math.pow(H,2)*(Math.pow((y-H/2),2))) { // jei taskas yra tikslaus kugio viduje, pridedame i tasku sarasa
				var point = new THREE.Vector3(x,y,z);
				points.push(point);
			}
		}

		// Sukuriama sachmatu tekstura
		var material = new THREE.MeshLambertMaterial();
		const texture = new THREE.TextureLoader().load( "textures/checkers64.png" );
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		// Kuo mazesnis pakartojimu skaicius, tuo labiau dideja kvadraciukai
		texture.repeat.set((R*2*Math.PI)/H/settings["Kvadratu dydis"],1/settings["Kvadratu dydis"] );
		material.map = texture;
		
		// Sukuriamas kugis
		var geometry = new THREE.ConvexGeometry(points);
		// Taisomas zebro efektas
		for(var i = 0; i< geometry.faces.length; i++) {
			var wall = geometry.faces[i];
			
			var uvA = toUV(geometry.vertices[wall.a]);
			var uvB = toUV(geometry.vertices[wall.b]);
			var uvC = toUV(geometry.vertices[wall.c]);
			
			// Paskaičiuojam kuriam vienetinio apskritimo ketvirčiui kiekviena uv priklauso
			var before1U = [];
			var after0U = [];
			nearStitching(before1U, after0U, uvA);
			nearStitching(before1U, after0U, uvB);
			nearStitching(before1U, after0U, uvC);
			
			//jei yra trikampis einantis per susiuvimo vieta
			if(before1U.length > 0 && after0U.length > 0) {
				for(var j = 0; j < before1U.length; j++) {
					// u = u + 1
					before1U[j].x++;
				}
			}
			geometry.faceVertexUvs[0].push([uvA, uvB, uvC]);
		}
		
		geometry.uvsNeedUpdate = true;
		
		var mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);
		
		console.log("etest");
		$("#WebGL-output").append(renderer.domElement);
	}

	function removeSceneObjects() {
		for( var i = scene.children.length - 1; i >= 0; i--) { 
			obj = scene.children[i];
			scene.remove(obj); 
		}
		document.getElementById("WebGL-output").innerHTML = '';
	}
	
	function addLights() {
		const light = new THREE.AmbientLight(0x242424, 3);
		scene.add(light);
		
		const spotLight = new THREE.SpotLight(0xffffff);
		spotLight.position.set(0, 250, 0 );
		spotLight.angle = Math.PI/3;
		spotLight.castShadow = true;
		scene.add(spotLight);
	}
	
	// Nustatomos u ir v is tasko koordinaciu
	function toUV(vertex) {
		var v = (vertex.y + H/2)/H;
		var u = Math.atan2(vertex.x, vertex.z) / 2 / Math.PI;
		//var u = Math.atan2(vertex.x, vertex.z) / 2 / Math.PI;
		if(u < 0) { //jei u minusinis normalizuojam, kad būtų nuo 0 iki 1;
			u++;
		}
		return new THREE.Vector2(u,v);
	}

	// Paskaiciuoja, ar netoli susiuvimo vietos
	function nearStitching(after0U, before1U, uv) {
		if(uv.x >= 0.8) {
			before1U.push(uv);
		}
		
		if(uv.x <= 0.2) {
			after0U.push(uv);
		}
	}
	
	function animate() {
		requestAnimationFrame( animate );
		cameraControls.update();
		renderer.render( scene, camera );
	}
	animate();
});



