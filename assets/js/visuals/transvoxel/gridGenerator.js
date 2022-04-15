import {MathUtils, Vector3} from "../../../../node_modules/three/build/three.module.js"

export default class GridGenerator {

    size = {x:0, y:0, z:0};
    grid = [];
    pos = {x:0, y:0, z:0};

    clear() {
        for(let x = 0; x < this.size.x; x++) {
            this.grid[x] = [];
            for(let y = 0; y < this.size.y; y++) {
                this.grid[x][y] = [];
                for(let z = 0; z < this.size.z; z++) {
                    this.grid[x][y][z] = {value:-127};
                }
            }
        }
        return this;
    }

    constructor(size) {
        this.size = size;
        this.clear();
    }

    sphere(pos, size) {

        const augSize = size;

        for(let x = 0; x < this.size.x; x++) {
            for (let y = 0; y < this.size.y; y++) {
                for (let z = 0; z < this.size.z; z++) {
                    if(((x-pos.x) * (x-pos.x) + (y-pos.y) * (y-pos.y) + (z-pos.z) * (z-pos.z)) <= (augSize*augSize)) {
                        const dif = Math.sqrt(size * size) - Math.sqrt((x-pos.x) * (x-pos.x) + (y-pos.y) * (y-pos.y) + (z-pos.z) * (z-pos.z));
                        if( dif >= 1) {
                            this.grid[x][y][z] = {value:126};
                        } else {
                            this.grid[x][y][z] = {value:126 * (1-dif)};
                        }
                    }
                }
            }
        }

        return this;

    }

    get() {
        return this.grid;
    }

    plane(height) {

        for(let x = 0; x < this.size.x; x++) {
            for(let y = 0; y < this.size.y; y++) {
                for(let z = 0; z < this.size.z; z++) {
                    if(y < height) {
                        let q = MathUtils.clamp(12, 0, 1);
                        debugger;
                        this.grid[x][y][z] = {value:126};
                    }
                }
            }
        }
        return this;

    }

    sine(height, magnitude, period) {

        for(let x = 0; x < this.size.x; x++) {
            var expectedHeght = height + Math.sin(x * period) * magnitude;
            //debugger;
            for(let y = 0; y < this.size.y; y++) {
                for(let z = 0; z < this.size.z; z++) {
                    if(y <= Math.ceil(expectedHeght)) {
                        this.grid[x][y][z] = {value:MathUtils.clamp(expectedHeght - y, -1, 1) * 126};
                    }
                }
            }
        }
        return this;

    }

    slope(height, direction) {

        for(let x = 0; x < this.size.x; x++) {
            for(let y = 0; y < this.size.y; y++) {
                for(let z = 0; z < this.size.z; z++) {
                    let currVec = new Vector3(x - this.size.x/2, y - this.size.y/2, z - this.size.z/2);
                    var expectedHeght = currVec.dot(direction) + this.size.y/2;

                    if(y <= Math.ceil(expectedHeght)) {
                        //console.log({x:x, y:y, z:z, value:MathUtils.clamp(expectedHeght - y, -1, 1) * 126});
                        this.grid[x][y][z] = {value:MathUtils.clamp(expectedHeght - y - 1, -1, 1) * 126};
                    }

                    /*if(y === 0) {
                        //console.log({x:x, y:y, z:z, value:MathUtils.clamp(expectedHeght - y, -1, 1) * 126});
                        this.grid[x][y][z] = {value:126};
                    }*/

                }
            }
        }
        return this;

    }


}