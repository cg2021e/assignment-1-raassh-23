export const vertexShaderCode = `
    attribute vec3 aPosition;
    attribute vec3 aColor;
    varying vec3 vColor;

    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;

    attribute vec3 aNormal;
    varying vec3 vNormal;

    varying vec3 vPosition;

    void main() {
        gl_Position = uProjection * uView * uModel * (vec4(aPosition * 2.0 / 3.0, 1.0));

        vColor = aColor;
        vNormal = aNormal;
        vPosition = (uModel * (vec4(aPosition * 2.0 / 3.0, 1.0))).xyz;
    }
`