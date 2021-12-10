import { vertexShaderCode } from './vertexShaderCode.js';
import { fragmentShaderCode } from './fragmentShaderCode.js';
import { verticesEraser, verticesCube, verticesPlane } from './vertices.js';
import { indicesEraser, indicesCube, indicesPlane } from './indices.js';
import { mat4, mat3 } from "./gl-matrix/index.js";
import { mergeIndices, mergeVertices, getAllVerticesWithSurfaceNormal } from "./utils.js";

window.onload = () => {
    /**
     *  @type {HTMLCanvasElement} canvas
     */
    const canvas = document.getElementById("drawing-canvas");

    /**
     *  @type {WebGLRenderingContext} gl 
     */
    const gl = canvas.getContext("webgl");

    const verticeAndIndices = [
        [verticesEraser, indicesEraser],
        [verticesEraser, indicesEraser],
        [verticesCube, indicesCube],
        [verticesPlane, indicesPlane],
    ];

    const [indicesCount,] = mergeIndices(...verticeAndIndices.map((elem => elem[1])));
    const vertices = mergeVertices(getAllVerticesWithSurfaceNormal(...verticeAndIndices));

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

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

    const uIsOn = gl.getUniformLocation(shaderProgram, "uIsOn");

    const scale = 0.8;
    const uScale = gl.getUniformLocation(shaderProgram, "uScale");
    gl.uniform1f(uScale, scale);

    const camera = [0, 1, 3];
    const lightCube = [0, 0, 1];

    const models = [mat4.create(), mat4.create(), mat4.create(), mat4.create()];

    // model for left 
    mat4.translate(models[0], models[0], [-0.7, 0, 0]);

    // model for right
    mat4.translate(models[1], models[1], [0.7, 0, 0]);
    mat4.rotateY(models[1], models[1], -Math.PI / 2);

    // model for cube;
    mat4.translate(models[2], models[2], lightCube);

    // model for plane
    const bottomVertices = Math.min(...verticesEraser.map(elem => elem[1]));
    mat4.translate(models[3], models[3], [0, bottomVertices*scale, 0]);

    const view = mat4.create();
    mat4.lookAt(view, camera, [camera[0], -0.1, 0], [0, 1, 0]);
    gl.uniformMatrix4fv(uView, false, view);
    gl.uniform3fv(uViewerPosition, camera);

    gl.uniform3fv(uLightPosition, lightCube);

    // constant for each model
    const shininessConstants = [5, 200, 0, 0];
    const ambientIntensities = [0.340, 0.340, 1, 1];

    let isOn = true;
    window.addEventListener("keydown", (e) => {
        if (e.code == "Space") {
            isOn = !isOn;
            ambientIntensities[2] = isOn;
        }
    });


    function render() {
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.9, 0.9, 0.9, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniform1i(uIsOn, isOn);

        let count = 0;
        indicesCount.forEach((v, i) => {
            gl.uniformMatrix4fv(uModel, false, models[i]);

            const normalModel = mat3.create();
            mat3.normalFromMat4(normalModel, models[i]);
            gl.uniformMatrix3fv(uNormalModel, false, normalModel);

            gl.uniform1f(uShininessConstant, shininessConstants[i]);
            gl.uniform1f(uAmbientIntensity, ambientIntensities[i]);

            gl.drawArrays(gl.TRIANGLES, count, indicesCount[i]);
            count += indicesCount[i];
        });

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}