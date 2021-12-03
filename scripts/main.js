import { vertexShaderCode } from './vertexShaderCode.js';
import { fragmentShaderCode } from './fragmentShaderCode.js';
import { vertices } from './vertices.js';

window.onload = () => {
    /**
     *  @type {HTMLCanvasElement} canvas
     */
    const canvas = document.getElementById("drawing-canvas");

    /**
     *  @type {WebGLRenderingContext} gl 
     */
    const gl = canvas.getContext("webgl");

    const vertices = [
        ...verticesFrontBack, ...verticesFrontMiddle, ...verticesFrontFront,
        ...verticesLeftBack, ...verticesLeftMiddle, ...verticesLeftFront,
    ]

    const verticesCount = [
        verticesFrontBack.length, verticesFrontMiddle.length, verticesFrontFront.length,
        verticesLeftBack.length, verticesLeftMiddle.length, verticesLeftFront.length,
    ]

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
    gl.useProgram(shaderProgram);

    const aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(aPosition);

    const aColor = gl.getAttribLocation(shaderProgram, "aColor");
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(aColor);

    const uTranslationMatrix = gl.getUniformLocation(shaderProgram, "uTranslationMatrix");

    const speed = 0.0140
    let moveDir = 1 // 1 untuk ke atas, -1 untuk ke bawah
    let dy = 0;

    let paused = false;

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

    function render() {
        if (!paused) {
            moveDir = dy >= 0.605 || dy <= -0.627 ? -moveDir : moveDir;
            dy += speed * moveDir;

            const translationMatrixLeft = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ];

            const translationMatrixRight = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, dy, 0, 1,
            ];

            gl.clearColor(0.8, 0.8, 0.8, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const rightStartIndex = 3;
            let start = 0;

            verticesCount.forEach((verticeCount, i) => {
                const count = verticeCount / 5;
                const translationMatrix = i < rightStartIndex ? translationMatrixLeft : translationMatrixRight;

                gl.uniformMatrix4fv(uTranslationMatrix, false, translationMatrix);
                gl.drawArrays(gl.TRIANGLE_FAN, start, count);

                start += count;
            });
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}