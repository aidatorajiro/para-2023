// eslint-disable-next-line @typescript-eslint/no-unused-vars
import MainStyle from "./MainStyle.sass"

import React, { useCallback, useEffect, useState } from "react";
import * as AFRAME from 'aframe';
import {centerObject3D, send_log, setOpacityObject3D} from './utils';
import controllerLeftGLTF from './assets/controller-left.glb';

const THREE = AFRAME.THREE;
const COEFF_CALIB_POS = 0.33;
const COEFF_CALIB_SIZE = 1.0;

interface GLTFComponentInner extends AFRAME.Component<String> {
  model: AFRAME.THREE.Group
}

type GLTFComponent = {
  "gltf-model": GLTFComponentInner
}

const MyApp = function () {

  const [loadedModel, setLoadedModel] = useState<string>("");
  const [sizeCoeff, setSizeCoeff] = useState<number>(0.5);
  const [rotOffset, setRotOffset] = useState<AFRAME.THREE.Quaternion>(new THREE.Quaternion(0, 0, 0, 1));
  const [firstCalibB, setFirstCalibB] = useState<boolean>(true);
  const [exitCalibB, setExitCalibB] = useState<boolean>(false);
  const [rotOffsetOffset, setRotOffsetOffset] = useState<AFRAME.THREE.Quaternion>(new THREE.Quaternion(0, 0, 0, 1));
  const [rotOffsetBackup, setRotOffsetBackup] = useState<AFRAME.THREE.Quaternion>(new THREE.Quaternion(0, 0, 0, 1));
  const [calibrationGrip, setCalibrationGrip] = useState<boolean>(false);
  const [calibrationTrigger, setCalibrationTrigger] = useState<boolean>(false);
  const [calibrationA, setCalibrationA] = useState<boolean>(false);
  const [calibrationB, setCalibrationB] = useState<boolean>(false);
  const [glbFileName, setGlbFileName] = useState<string>("model.glb");
  const [showOrigin, setShowOrigin] = useState<boolean>(false);

  const sphereRef = React.useRef<AFRAME.Entity<GLTFComponent>>(undefined);
  const sceneRef = React.useRef<AFRAME.Scene>(undefined);
  const skullRef = React.useRef<AFRAME.Entity>(undefined);
  const rightHandRef = React.useRef<AFRAME.Entity>(undefined);
  const leftHandRef = React.useRef<AFRAME.Entity>(undefined);
  const glbRef = React.useRef<AFRAME.Entity<GLTFComponent>>(undefined);

  useEffect(() => {
    const obj3d = sphereRef.current?.object3D;

    if (obj3d) {
      if (showOrigin) {
        setOpacityObject3D(obj3d, 1, []);
      } else {
        setOpacityObject3D(obj3d, 0, []);
      }
    }
  }, [showOrigin])

  //
  // Retrieve GLB filename
  //
  useEffect(() => {
    let end = false;

    const int = setInterval(async () => {
      const data = await fetch('/api/get_glb_filename');
      if (end) { return; }
      const filename = (await data.json())['filename'];
      if (end) { return; }
      if (filename !== glbFileName) {
        setGlbFileName(filename)
        glbRef.current?.addEventListener('model-loaded', () => {setLoadedModel(filename)})
      }
    }, 5000)

    return () => {
      end = true;
      clearInterval(int)
    }
  }, [glbFileName])

  //
  // Justify center point
  //
  useEffect(() => {
    send_log({message: "model " + loadedModel + " successfully loaded to HMD"})
    const modelData = glbRef.current?.components["gltf-model"].model;
    if (modelData) {
      const calc_log = JSON.stringify(centerObject3D(modelData))
      send_log({"message": "Fix the center point and the scale", calc_log})
    }
  }, [loadedModel])
  
  //
  // Construct Position and Rotation History
  //
  const [posHistory, setPosHistory] = React.useState<AFRAME.THREE.Vector3[]>([]);
  const [rotHistory, setRotHistory] = React.useState<AFRAME.THREE.Quaternion[]>([]);
  useEffect(() => {
    const int = setInterval(() => {
      if (calibrationGrip || calibrationTrigger || calibrationA || calibrationB) {
        const currentPos = rightHandRef.current?.object3D.position.clone();
        if (currentPos) {
          setPosHistory(x => [...x, currentPos]);
        }

        const currentRot = rightHandRef.current?.object3D.quaternion.clone();
        if (currentRot) {
          setRotHistory(x => [...x, currentRot]);
        }
      } else if (posHistory.length > 0 || rotHistory.length > 0) {
        setPosHistory([])
        setRotHistory([])
      }
    }, 1000/60)

    return () => {
      clearInterval(int)
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calibrationGrip, calibrationTrigger, calibrationA, calibrationB])

  const moveModel = useCallback((diff: AFRAME.THREE.Vector3) => {
        const wrapper = skullRef.current?.object3D;
        const model = wrapper?.children[0];
        if (model) {
          model.position.add(diff.applyQuaternion(wrapper.quaternion.clone().invert()))
        }
  }, [])
  
  /*const rotateModelDiff = useCallback((diff: AFRAME.THREE.Quaternion) => {
        const rotL = leftHandRef.current?.object3D.quaternion.clone()
        if (rotL !== undefined) {
          const rotLi = rotL.clone().invert()
          setRotOffset(x => rotLi.multiply(diff).multiply(rotL).multiply(x.clone()))
        }
  }, [])*/

  const rotateModelAbs = useCallback((target: AFRAME.THREE.Quaternion) => {
    const rotL = leftHandRef.current?.object3D.quaternion.clone()
    if (rotL !== undefined) {
      const rotLi = rotL.clone().invert()
      setRotOffset(rotLi.multiply(target).multiply(rotL))
    }
  }, [])

  //
  // Calculate calibration values from position / rotation history of right hand controller
  //
  useEffect(() => {
    if (calibrationTrigger) {
      setShowOrigin(true)
    } else {
      if (!calibrationB) {
        setShowOrigin(false)
      }
    }
    if (calibrationGrip) {
      if (posHistory.length > 2) {
        const newdata = posHistory[posHistory.length - 1]
        const olddata = posHistory[posHistory.length - 2]
        const diff = newdata.clone().sub(olddata).multiplyScalar(COEFF_CALIB_POS).divideScalar(sizeCoeff)
	      moveModel(diff)
      }
    }
    if (calibrationB) {
      const rotR = rightHandRef.current?.object3D.quaternion.clone()
      if (rotR !== undefined) {
        if (firstCalibB) {
          const rotL = leftHandRef.current?.object3D.quaternion.clone()
          if (rotL !== undefined) {
            setRotOffsetOffset(rotR.clone().invert().multiply(rotL).multiply(rotOffsetBackup).multiply(rotL.clone().invert()))
          }
          setFirstCalibB(false)
          setExitCalibB(true)
          setShowOrigin(true)
          send_log({message: 'calib b start (inner logic)'})
        } else {
          rotateModelAbs(rotR.multiply(rotOffsetOffset))
        }
      }
    } else {
      if (exitCalibB) {
        const rotR = rightHandRef.current?.object3D.quaternion.clone()
        if (rotR !== undefined) {
          setRotOffsetBackup(rotOffset)
        }
        setExitCalibB(false)
        setFirstCalibB(true)
        setShowOrigin(false)
        send_log({message: 'calib b end (inner logic)'})
      }
    }
    if (calibrationA) {
      if (posHistory.length > 2) {
        const newdata = posHistory[posHistory.length - 1]
        const olddata = posHistory[posHistory.length - 2]
        const skullPos = skullRef.current?.object3D.position;
        if (skullPos) {
          const normal = rightHandRef.current?.object3D.position.clone().sub(skullPos).normalize();
          if (normal) {
            const diff = newdata.clone().sub(olddata).dot(normal) * COEFF_CALIB_SIZE;
            setSizeCoeff(x => x + diff)
          }
        }
      }
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calibrationGrip, calibrationTrigger, calibrationA, calibrationB, posHistory, rotHistory, rotOffsetOffset, firstCalibB, exitCalibB, rotOffsetBackup, showOrigin])

  //
  // Sync size of face GLB model with calibration value
  //
  useEffect(() => {
    skullRef.current?.object3D.scale.set(sizeCoeff, sizeCoeff, sizeCoeff);
  }, [sizeCoeff])

  //
  // Calculate rotation and position of face GLB model
  //
  useEffect(() => {
    const int = setInterval(() => {
      const leftobj = leftHandRef.current?.object3D;
      if (leftobj) {
        const pos = leftobj.position;
        const qua = leftobj.quaternion;
        const skullPos = skullRef.current?.object3D.position.set(pos.x, pos.y, pos.z);
        if (skullPos) {
          sphereRef.current?.object3D.position.set(skullPos.x, skullPos.y, skullPos.z);
          sphereRef.current?.object3D.quaternion.set(qua.x, qua.y, qua.z, qua.w);
        }
      }

      const rot = leftHandRef.current?.object3D.quaternion;
      if (rot) {
        const r = rot.clone();
        skullRef.current?.object3D.quaternion.set(r.x, r.y, r.z, r.w).multiply(rotOffset);
      }
    }, 1000/60)

    return () => {
      clearInterval(int)
    }
  }, [rotOffset])

  //
  // Register events
  //
  useEffect(() => {
    const eventfuncs = {
      gripdown: function() { // pos global
        send_log({message: 'start calib (Grip)'})
        setCalibrationGrip(true)
      },
      gripup: function () {
        send_log({message: 'end calib (Grip)'})
        setCalibrationGrip(false)
      },
      triggerdown: function () { // pos local
        send_log({message: 'start calib (Trigger)'})
        setCalibrationTrigger(true)
      },
      triggerup: function () {
        send_log({message: 'end calib (Trigger)'})
        setCalibrationTrigger(false)
      },
      abuttondown: function () { // scale
        send_log({message: 'start calib (A)'})
        setCalibrationA(true)
      },
      abuttonup: function () {
        send_log({message: 'end calib (A)'})
        setCalibrationA(false)
      },
      bbuttondown: function () { // rotation
        send_log({message: 'start calib (B)'})
        setCalibrationB(true)
      },
      bbuttonup: function () {
        send_log({message: 'end calib (B)'})
        setCalibrationB(false)
      },
    }

    const rightHandRef_current_ = rightHandRef.current

    for (const funcname in eventfuncs) {
      rightHandRef_current_?.addEventListener(funcname, eventfuncs[funcname as keyof typeof eventfuncs]);
    }

    return () => {
      for (const funcname in eventfuncs) {
        rightHandRef_current_?.removeEventListener(funcname, eventfuncs[funcname as keyof typeof eventfuncs]);
      } 
    }
  }, [])

  return(
    <a-scene xr-mode-ui="enabled: true; XRMode: ar;" ref={sceneRef}>
      <a-entity ref={skullRef}>
        <a-entity ref={glbRef} gltf-model={glbFileName}></a-entity>
      </a-entity>
      <a-entity ref={sphereRef} gltf-model={controllerLeftGLTF}></a-entity>
      <a-entity ref={rightHandRef}
        oculus-touch-controls="hand: right"
        ></a-entity>
      <a-entity ref={leftHandRef}
        oculus-touch-controls="hand: left; model: false;"
        ></a-entity>
    </a-scene>
  );
}

export default MyApp;
