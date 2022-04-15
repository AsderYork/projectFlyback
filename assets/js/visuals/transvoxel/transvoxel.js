
import * as TABLES from '/assets/js/visuals/transvoxel/tables.js'

class Pos {
    x = 0;
    y = 0;
    z = 0;

    constructor(x,y,z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    addPos(pos) {
        return new Pos(this.x + pos.x, this.y + pos.y, this.z + pos.z);
    }

    negate() {
        return new Pos(-this.x,  -this.y, -this.z);
    }

    divideScalarInplace(scalar) {
        this.x = this.x / scalar;
        this.y = this.y / scalar;
        this.z = this.z / scalar;
        return this;
    }

    addPosInplace(pos) {
        this.x += pos.x;
        this.y += pos.y;
        this.z += pos.z;
    }

    substractPos(pos) {
        return new Pos(this.x - pos.x, this.y - pos.y, this.z - pos.z);
    }

    crossProduct(pos) {
        return new Pos(this.y*pos.z - this.z*pos.y, this.z*pos.x - this.x*pos.z, this.x*pos.y - this.y*pos.x);
    }

    distSquared(pos) {
        return Math.pow(x - pos.x, 2) + Math.pow(this.y + pos.y, 2) + Math.pow(this.z + pos.z, 2);
    }

    multiplyScalar(scalar) {
        return new Pos(this.x * scalar, this.y * scalar,this.z * scalar);
    }

    interpolate(t, pos) {

        return new Pos(this.x * t + pos.x * (1 - t), this.y * t + pos.y * (1 - t), this.z * t + pos.z * (1 - t));

    }

}

export default class Transvoxel {

    size = null;
    indices = [];
    vertices = [];
    normals = [];
    buffer = [];
    pos = {x:0, y:0, z:0};
    currBufferLayer = 0;

    constructor() {
    }

    swapBuffer() {
        this.currBufferLayer = (this.currBufferLayer + 1) % 2;

        if(this.buffer[this.currBufferLayer] === undefined) {
            this.buffer[this.currBufferLayer] = [];
        }
        for(let y = 0; y < this.size.y; y++) {
            this.buffer[this.currBufferLayer][y] = [];

            for(let z = 0; z < this.size.z; z++) {
                this.buffer[this.currBufferLayer][y][z] = [];
            }
        }

    }

    addToBuffer(pos, index, vec) {
        this.buffer[this.currBufferLayer][pos.y][pos.z][index] = vec;
    }

    getNeighbour(pos, neghbourDir, index) {
        const layer = (pos.x + ((neghbourDir >> 0) & 0x01)) % 2;
        const posy = pos.y - ((neghbourDir >> 2) & 0x01);
        const posz = pos.z - ((neghbourDir >> 1) & 0x01);
        return (this.buffer[layer] && posy >= 0 && posz >= 0) ? this.buffer[layer][posy][posz][index] : undefined;
    }

    addToNeighbour(pos, neghbourDir, index, val) {
        const layer = (pos.x + ((neghbourDir >> 0) & 0x01)) % 2;
        const posy = pos.y - ((neghbourDir >> 2) & 0x01);
        const posz = pos.z - ((neghbourDir >> 1) & 0x01);
        if(this.buffer[layer] && posy >= 0 && posz >= 0) {
            this.buffer[layer][posy][posz][index] = val;
        }
    }

    getByPos(grid, pos) {
        return grid[pos.x][pos.y][pos.z];
    }

    getByCellIndex(grid, pos, index) {
        return this.getByPos(grid, pos.addPos(this.getPosByIndex(index)));
    }

    getPosByIndex(index) {
        return new Pos(index % 2, (~~(index / 4)) % 2, (~~(index / 2)) % 2);
    }

    processCell(grid, pos, level) {

        const nodePos = [0, 1, 2, 3, 4, 5, 6, 7].map(index => this.getPosByIndex(index).multiplyScalar(level).addPos(pos));
        const nodes = nodePos.map(indexPos => this.getByPos(grid, indexPos));

        const caseCode = ((nodes[0].value >> 7) & 0x01)
            | ((nodes[1].value >> 6) & 0x02)
            | ((nodes[2].value >> 5) & 0x04)
            | ((nodes[3].value >> 4) & 0x08)
            | ((nodes[4].value >> 3) & 0x10)
            | ((nodes[5].value >> 2) & 0x20)
            | ((nodes[6].value >> 1) & 0x40)
            | (nodes[7].value & 0x80);

        if ((caseCode ^ ((nodes[7].value >> 7) & 0xFF)) !== 0) {
            const caseId = TABLES.regularCellClass[caseCode];
            const triangles = TABLES.RegularCellData[caseId];
            const vertices = TABLES.regularVertexData[caseCode];

            const currIndex = this.vertices.length;
            const addedVertices = [];

            for (const edgeCode of vertices) {

                const v0 = (edgeCode >> 4) & 0x0F;
                const v1 = edgeCode & 0x0F;
                const t = this.findDivideBetween(grid, nodePos[v0], nodePos[v1], level);


                const neighbour = ((edgeCode >> 12) & 0x0F);
                const neghbourIndex = (edgeCode >> 8) & 0x0F;

                const neighbourVertex = this.getNeighbour(pos.multiplyScalar(1/level), neighbour, neghbourIndex);

                if(neighbourVertex && neighbour !== 8) {
                    addedVertices.push(neighbourVertex);
                } else {
                    const Q = nodePos[v0].interpolate(t, nodePos[v1]);

                    this.vertices.push(Q.addPos(this.pos));
                    const Qindex = this.vertices.length - 1;
                    this.addToNeighbour(pos.multiplyScalar(1/level), neighbour, neghbourIndex, Qindex);
                    addedVertices.push(Qindex);
                }



                // Cell has a nontrivial triangulation.
            }

            for (var i = 0; i < triangles[1].length; i++) {
                const index = triangles[1][i];
                this.indices.push(addedVertices[index]);

                if((i + 1) % 3 === 0) {
                    const normal = this.vertices[addedVertices[triangles[1][index]]].substractPos(this.vertices[addedVertices[triangles[1][index-1]]])
                        .crossProduct(this.vertices[addedVertices[triangles[1][index]]].substractPos(this.vertices[addedVertices[triangles[1][index-2]]])).negate();

                    for(var normind = 0; normind < 3; normind++) {
                        const indexToSet = this.indices[this.indices.length - 1 - normind];
                        if(this.normals[indexToSet] === undefined) {
                            this.normals[indexToSet] = normal;
                            this.normals[indexToSet].hits = 1;
                        } else {
                            this.normals[indexToSet].addPosInplace(normal);
                            this.normals[indexToSet].hits = this.normals[indexToSet].hits + 1;
                        }
                    }

                }

            }

        }


    }

    findDivideBetween(grid, v1, v2, level) {

        let v1Val = this.getByPos(grid, v1).value;
        let v2Val = this.getByPos(grid, v2).value;
        let vect = v2.substractPos(v1);

        let curlevel = level;
        let shift = 0;
        while (curlevel > 1) {
            if(v1Val * v2Val > 0) {
                return 0;
            }
            let midVal = this.getByPos(grid, v1.addPos(vect.divideScalarInplace(2))).value;
            if(v1Val * midVal > 0) {
                v1 = v1.addPos(vect);
                shift += curlevel / 2;
            }
            curlevel /= 2;

        }
        return ((((v2Val - v1Val + 126) / 255) + shift) / level);
    }

    makeMesh(grid, pos = {x:0, y:0, z:0}, lod = 1, transitionCells = [1, 0, 0, 0, 0 ,0]) {

        this.size = new Pos(grid.length, grid[0].length, grid[0][0].length);
        this.pos = pos;

        this.swapBuffer();


        for(let x = 0; x < this.size.x - lod; x+=lod) {
            this.swapBuffer();
            for(let y = 0; y < this.size.y - lod; y+= lod) {
                for(let z = 0; z < this.size.z - lod; z+=lod) {
                    this.processCell(grid, new Pos(x, y, z), lod);
                }
            }
        }

        for(let normal = 0; normal < this.normals.length; normal++) {
            this.normals[normal].divideScalarInplace(this.normals[normal].hits);
        }


    }
}
