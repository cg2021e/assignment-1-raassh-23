export const vertexShaderCode = `
    attribute vec2 aPosition;
    attribute vec3 aColor;
    varying vec3 vColor;
    uniform mat4 uTranslationMatrix;

    void main() {
        gl_Position = uTranslationMatrix * vec4(aPosition, 0.0, 1.0);
        gl_PointSize = 10.0;
        vColor = aColor;
    }
`