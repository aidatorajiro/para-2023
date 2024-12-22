import * as AFRAME from 'aframe';

/** 
 * Send a message to the server. */
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

/** 
 * Calculate volume of the given buffer geometry using `computeBoundingBox`. */
export function calculateVolume(geo: AFRAME.THREE.BufferGeometry) {
    geo.computeBoundingBox()
    const max = geo.boundingBox?.max.clone()
    const min = geo.boundingBox?.min.clone()
    if (max !== undefined && min !== undefined) {
        const diff = max.sub(min)
        return Math.abs(diff.x * diff.y * diff.z)
    }
}

export type CalculationLog = {
    children_count: number
    children_logs: CalculationLog[]
    is_mesh: boolean
    mesh_bounding_box?: [[number, number, number], [number, number, number]]
    mesh_volume?: number
    orig_scale: [number, number, number]
    orig_pos: [number, number, number]
    after_scale: [number, number, number]
    after_pos: [number, number, number]
}

/** 
 * Explore the given root 3D object. Then for all the 3d objects inside the root, set the center (for geometries, justify the center to the bounding box) to `(0, 0, 0)`, fix the scale to 1 (for grouping objects), and fix scale to `meshSize` (for the geometry inside meshes).
 * @param root the root object
 * @param meshSize the coefficient for the size of the meshes 
 * @returns the calculation process log */
export function centerObject3D(root: AFRAME.THREE.Object3D, meshSize: number = 0.65, log: CalculationLog[] = []) {
    const my_log: CalculationLog = {children_count: 0, children_logs: [], is_mesh: false, orig_pos: [0, 0, 0], orig_scale: [1, 1, 1], after_pos: [0, 0, 0], after_scale: [1, 1, 1]}

    my_log.orig_pos = root.position.clone().toArray()
    my_log.orig_scale = root.scale.clone().toArray()

    root.position.set(0, 0, 0)
    const v_3 = Math.pow(Math.abs(root.scale.x * root.scale.y * root.scale.z), 1/3)
    root.scale.multiplyScalar(1/v_3);

    if (root instanceof AFRAME.THREE.Mesh) {
        if (root.geometry instanceof AFRAME.THREE.BufferGeometry) {
            my_log.is_mesh = true
            root.geometry.clearGroups()
            const v_g = calculateVolume(root.geometry)

            const max = root.geometry.boundingBox?.max;
            const min = root.geometry.boundingBox?.min;
            if (max && min) {
                my_log.mesh_bounding_box = [max.clone().toArray(), min.clone().toArray()]
            }

            if (v_g) {
                my_log.mesh_volume = v_g
                const v_g_3 = Math.pow(v_g, 1/3)
                root.scale.multiplyScalar((1 / v_g_3) * meshSize)
            }
        }
    }

    my_log.after_pos = root.position.clone().toArray()
    my_log.after_scale = root.scale.clone().toArray()

    my_log.children_count = root.children.length

    for (let i = 0; i < root.children.length; i++) {
        const child = root.children[i]
        centerObject3D(child, meshSize, my_log.children_logs)
    }

    log.push(my_log)

    return log
}