import * as AFRAME from 'aframe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function send_log(data: any) {
    fetch("/api/log", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
}

export function calculateVolume(geo: AFRAME.THREE.BufferGeometry) {
    geo.computeBoundingBox()
    const max = geo.boundingBox?.max.clone()
    const min = geo.boundingBox?.min.clone()
    if (max !== undefined && min !== undefined) {
        const diff = max.sub(min)
        return Math.abs(diff.x * diff.y * diff.z)
    }
}

/// Explore the given 3D object and center everything.
export function centerObject3D(root: AFRAME.THREE.Object3D, meshSize: number = 0.65) {
    root.position.set(0, 0, 0)
    const v = Math.pow(Math.abs(root.scale.x * root.scale.y * root.scale.z), 1/3)
    root.scale.multiplyScalar(1/v);
    if (root instanceof AFRAME.THREE.Mesh) {
        if (root.geometry instanceof AFRAME.THREE.BufferGeometry) {
            root.geometry.clearGroups()
            const v_g = calculateVolume(root.geometry)
            if (v_g) {
                const v_g_3 = Math.pow(v_g, 1/3)
                root.scale.multiplyScalar((1 / v_g_3) * meshSize)
            }
        }
    }
    for (let i = 0; i < root.children.length; i++) {
        const child = root.children[i]
        centerObject3D(child)
    }
}