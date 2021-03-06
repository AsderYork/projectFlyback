import * as THREE from '/node_modules/three/build/three.module.js';

import TRANSVOXEL from '/assets/js/visuals/transvoxel/transvoxel.js';
import GRIDGENERATOR from '/assets/js/visuals/transvoxel/gridGenerator.js';
//import {OrbitControls} from "https://threejs.org/examples/jsm/controls/OrbitControls.js";

import CONTROL_FP from './visuals/firstPersonControls.js';
import {
    MathUtils,
    Spherical,
    Vector3
} from '../../../node_modules/three/build/three.module.js';

function makeBox(scene, position = null, scale = 1, color = 0x44aa88) {

    const geometry = new THREE.BoxGeometry( 1 * scale, 1 * scale, 1 * scale);
    const material = new THREE.MeshPhongMaterial({color: color, opacity:0.1});
    const cube = new THREE.Mesh(geometry, material);
    if(position) {
        cube.position.set(position.x, position.y, position.z);
    }

    scene.add(cube);
    return cube;

}

function setObjectPos(object, x, y, z) {
    object.position.set(x, y, z);
    return object;
}

function Vec3() {
    return new Vector3();
}

function visualizeGrid(scene, grid) {

    var elems = [];
    for(let x = 0; x < 3; x++) {
        for(let y = 0; y < 3; y++) {
            for(let z = 0; z < 3; z++) {
                let colorIndex = grid[x][y][z].value < 0 ? 0xB39FC9 : 0x5AED64;
                elems.push(makeBox(scene, new Vector3(x, y, z), 0.3, colorIndex/*(new THREE.Color(colorIndex, colorIndex, colorIndex)).getHex()*/));
            }
        }
    }
    return elems;

}

function populateChunks(scene, currAngle) {
    var NewObjects = [];

    for (let x = 0; x < 1; x++) {
        for (let y = 0; y < 1; y++) {
            for (let z = 0; z < 1; z++) {
                let transvoxel = new TRANSVOXEL();
                let gridGen = new GRIDGENERATOR({x: 3, y: 3, z: 3});
                let nodes = gridGen.slope(0, new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), THREE.MathUtils.degToRad(currAngle))).get();
                transvoxel.makeMesh(nodes, Vec3().addScalar(32).multiply(Vec3().set(x, y, z)), Math.pow(2, z + 0));
                NewObjects = NewObjects.concat(visualizeGrid(scene, nodes));

                const chunk = renderChunk(transvoxel);
                NewObjects.push(chunk);

                const wireframe = new THREE.WireframeGeometry( chunk.geometry );

                const line = new THREE.LineSegments( wireframe );
                line.material.depthTest = false;
                line.material.opacity = 0.25;
                line.material.transparent = true;

                NewObjects.push( line );


            }
        }
    }
    return NewObjects
}



function main() {

    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas});
    const camera = setObjectPos(new THREE.PerspectiveCamera(75, 2, 0.1, 1000), 0, 4, 20);
    const controls = new CONTROL_FP( camera, renderer.domElement, 2, 4);
    const scene = new THREE.Scene();

    scene.add(setObjectPos(new THREE.DirectionalLight(0xFFFFFF), -1, 2, 4));
    makeBox(scene);
    scene.add(new THREE.GridHelper(160, 10, new THREE.Color(0xff0000), new THREE.Color(0xffffff)));

    var controlledObjects = populateChunks(scene, 0);
    controlledObjects.map(x => scene.add(x));

    var currAngle = 0;
    var timeLast = 0;

    function render(currMill) {
        const time = (currMill - timeLast) * 0.001;
        timeLast = currMill;
        $(document).prop('title', time.toFixed(3));

        if (resizeRendererToDisplaySize(renderer, controls)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        if(controls.isKeyPressed('BracketLeft') || controls.isKeyPressed('BracketRight')) {
            currAngle += (controls.isKeyPressed('BracketRight') - controls.isKeyPressed('BracketLeft')) * time * 16;
            if(currAngle > 360) {
                currAngle =- 360;
            }
            if(currAngle < 0) {
                currAngle += 360;
            }
            controlledObjects.map(x => scene.remove(x));
            controlledObjects = [];
            controlledObjects = populateChunks(scene, currAngle);
            controlledObjects.map(x => scene.add(x));
        }



        controls.update(time);

        renderer.render(scene, camera);

    }

    renderer.setAnimationLoop(render);

}


function resizeRendererToDisplaySize(renderer, controls) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        controls.handleResize();
    }
    return needResize;
}

function renderChunk(transvoxel) {
    const positions = [];
    const normals = [];

    for(let vec of transvoxel.vertices) {
        positions.push(vec.x);
        positions.push(vec.y);
        positions.push(vec.z);
    }

    for(let norm of transvoxel.normals) {
        normals.push(norm.x);
        normals.push(norm.y);
        normals.push(norm.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.setIndex(transvoxel.indices);

    const material = new THREE.MeshPhongMaterial({color: 0x44aa88, opacity:0.4});

    return new THREE.Mesh(geometry, material);

}



main();
