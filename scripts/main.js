import { vertexShaderCode } from './vertexShaderCode.js';
import { fragmentShaderCode } from './fragmentShaderCode.js';
import { verticesEraser, verticesCube } from './vertices.js';
import { indicesEraser, indicesCube } from './indices.js';
import { mat4, mat3 } from "./gl-matrix/index.js";
import { mergeVerticesAndIndices } from "./utils.js";

window.onload = () => {
    /**
     *  @type {HTMLCanvasElement} canvas
     */
    const canvas = document.getElementById("drawing-canvas");

    /**
     *  @type {WebGLRenderingContext} gl 
     */
    const gl = canvas.getContext("webgl");

    const [vertices, indicesCount, indices] = mergeVerticesAndIndices(
                                                    [verticesEraser, indicesEraser], 
                                                    [verticesEraser, indicesEraser], 
                                                    [verticesCube, indicesCube]
                                                );


    console.log([vertices, indicesCount, indices]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(fragmentShader);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // check if shader error
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(shaderProgram);
        const vertexShaderInfo = gl.getShaderInfoLog(vertexShader);
        const fragmentShaderInfo = gl.getShaderInfoLog(fragmentShader);

        console.log(info);
        console.log("Vertex: " + vertexShaderInfo);
        console.log("Fragment: " + fragmentShaderInfo);

        throw new Error('Could not compile WebGL program.');
    }

    gl.useProgram(shaderProgram);

    const aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 9 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(aPosition);

    const aColor = gl.getAttribLocation(shaderProgram, "aColor");
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 9 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(aColor);

    const aNormal = gl.getAttribLocation(shaderProgram, "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 9 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(aNormal);

    const uModel = gl.getUniformLocation(shaderProgram, "uModel");
    const uView = gl.getUniformLocation(shaderProgram, "uView");
    const uProjection = gl.getUniformLocation(shaderProgram, "uProjection");

    const projection = mat4.create();
    mat4.perspective(projection, Math.PI / 3, 1, 0.5, 10);
    gl.uniformMatrix4fv(uProjection, false, projection);

    const uLightConstant = gl.getUniformLocation(shaderProgram, "uLightConstant");
    const uAmbientIntensity = gl.getUniformLocation(shaderProgram, "uAmbientIntensity");
    gl.uniform3fv(uLightConstant, [1, 1, 1]);

    const uLightPosition = gl.getUniformLocation(shaderProgram, "uLightPosition");

    const uNormalModel = gl.getUniformLocation(shaderProgram, "uNormalModel");

    const uViewerPosition = gl.getUniformLocation(shaderProgram, "uViewerPosition");

    const uShininessConstant = gl.getUniformLocation(shaderProgram, "uShininessConstant");

    let paused = false;
    const camera = [0, 0, 3];
    const lightCube = [0, 0, 0]

    window.onkeyup = (e) => {
        if (e.code === 'Space') paused = !paused;

        /**
         *  @type {HTMLParagraphElement} info
         */
        const info = document.getElementById("info");

        const str = info.innerHTML;
        const res = paused ? str.replace("pause", "resume") : str.replace("resume", "pause");

        info.innerHTML = res;
    };

    window.onkeydown = (e) => {
        if (e.code === 'KeyD') camera[0] += 0.05;

        if (e.code === 'KeyA') camera[0] -= 0.05;

        if (e.code === 'KeyW') lightCube[1] += 0.05;

        if (e.code === 'KeyS') lightCube[1] -= 0.05;
    }

    const models = [mat4.create(), mat4.create(), mat4.create()];

    // model for left 
    mat4.translate(models[0], models[0], [-0.8, 0, 0]);

    // model for right
    mat4.translate(models[1], models[1], [0.8, 0, 0]);
    mat4.rotateY(models[1], models[1], Math.PI / 2);

    // for each model
    const shininessConstants = [5, 200, 0]; 
    const ambientIntensities = [0.340, 0.340, 1];

    function render() {
        if (!paused) {
            const view = mat4.create();
            mat4.lookAt(view, camera, [camera[0], 0, 0], [0, 1, 0]);
            gl.uniformMatrix4fv(uView, false, view);
            gl.uniform3fv(uViewerPosition, camera);
            gl.uniform3fv(uLightPosition, lightCube);

            gl.enable(gl.DEPTH_TEST);
            gl.clearColor(0.9, 0.9, 0.9, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // model for cube
            models[2] = mat4.create();
            mat4.translate(models[2], models[2], lightCube);

            console.log(models);

            let count = 0;
            indicesCount.forEach((v, i) => {
                gl.uniformMatrix4fv(uModel, false, models[i]);

                const normalModel = mat3.create();
                mat3.normalFromMat4(normalModel, models[i]);
                gl.uniformMatrix3fv(uNormalModel, false, normalModel);

                gl.uniform1f(uShininessConstant, shininessConstants[i]);
                gl.uniform1f(uAmbientIntensity, ambientIntensities[i]);

                gl.drawElements(gl.TRIANGLE_STRIP, indicesCount[i], gl.UNSIGNED_SHORT, count * Uint16Array.BYTES_PER_ELEMENT);
                count += indicesCount[i];
            });
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}