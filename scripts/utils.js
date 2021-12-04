// argument vertices1, vertices2, ...
export const mergeVertices = (...verticesArray) => { 
    const returnVertices = []

    verticesArray.forEach(vertices => {
        returnVertices.push(...vertices)
    });

    return returnVertices;
}

// argument indices1, indices2, ...
export const mergeIndices = (...indicesArray) => {
    const indicesCount = [];
    const returnIndices = [];
    const indexMax = [];

    indicesArray.forEach(indices => {
        indicesCount.push(indices.length);
        returnIndices.push(...indices.map(index => index + indexMax.reduce((acc, curr) => acc + curr, 0)));
        console.log(indexMax.reduce((acc, curr) => acc + curr, 0));
        indexMax.push(Math.max(...indices) + 1);
    });

    console.log(indexMax);

    return [indicesCount, returnIndices];
}

// argument [vertices1, indices1], [vertices2, indices2], ...
export const mergeVerticesAndIndices = (...verticesAndIndicesArray) => {
    const verticesArray = verticesAndIndicesArray.map(verticesAndIndices => verticesAndIndices[0]);
    const indiesArray = verticesAndIndicesArray.map(verticesAndIndices => verticesAndIndices[1]);

    return [mergeVertices(...verticesArray), ...mergeIndices(...indiesArray)];
}