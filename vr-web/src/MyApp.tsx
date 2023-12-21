/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import * as AFRAME from 'aframe';
import {send_log} from './utils';

const THREE = AFRAME.THREE

const MyApp = function () {
  const COEFF_CALIB_POS = 0.33;
  const COEFF_CALIB_ROT = 0.33;
  const COEFF_CALIB_SIZE = 1.0;

  const [sizeCoeff, setSizeCoeff] = useState<number>(0.5);
  const [posOffset, setPosOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [rotOffset, setRotOffset] = useState<THREE.Quaternion>(new THREE.Quaternion(0, 0, 0, 1));
  const [calibrationGrip, setCalibrationGrip] = useState<boolean>(false);
  const [calibrationTrigger, setCalibrationTrigger] = useState<boolean>(false);
  const [calibrationA, setCalibrationA] = useState<boolean>(false);
  const [calibrationB, setCalibrationB] = useState<boolean>(false);

  const sphereRef = React.useRef<AFRAME.Entity>();
  const sceneRef = React.useRef<AFRAME.Scene>();
  const skullRef = React.useRef<AFRAME.Entity>();
  const rightHandRef = React.useRef<AFRAME.Entity>();
  const leftHandRef = React.useRef<AFRAME.Entity>();

  const [posHistory, setPosHistory] = React.useState<THREE.Vector3[]>([]);
  const [rotHistory, setRotHistory] = React.useState<THREE.Quaternion[]>([]);
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
  }, [calibrationGrip, calibrationTrigger, calibrationA, calibrationB])

  useEffect(() => {
    if (calibrationTrigger) {
      if (posHistory.length > 2) {
        const newdata = posHistory[posHistory.length - 1]
        const olddata = posHistory[posHistory.length - 2]
        const diff = newdata.clone().sub(olddata).multiplyScalar(COEFF_CALIB_POS)
        const leftobj = leftHandRef.current?.object3D;
        if (leftobj) {
          setPosOffset(x => x.clone().add(diff.applyQuaternion(leftobj.quaternion.clone().invert())))
        }
      }
    }
    if (calibrationGrip) {
      if (posHistory.length > 2) {
        const newdata = posHistory[posHistory.length - 1]
        const olddata = posHistory[posHistory.length - 2]
        const diff = newdata.clone().sub(olddata).multiplyScalar(COEFF_CALIB_POS).divideScalar(sizeCoeff)
        const wrapper = skullRef.current?.object3D;
        const model = wrapper?.children[0];
        if (model) {
          model.position.add(diff.applyQuaternion(wrapper.quaternion.clone().invert()))
        }
      }
    }
    if (calibrationB) {
      if (rotHistory.length > 2) {
        const newdata = rotHistory[rotHistory.length - 1]
        const olddata = rotHistory[rotHistory.length - 2]
        const diff = newdata.clone().multiply(olddata.clone().invert())
        // setRotOffset(obj => obj.clone().multiply(diff))
        setRotOffset(obj => newdata.clone())
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
  }, [calibrationGrip, calibrationTrigger, calibrationA, posHistory, rotHistory])

  useEffect(() => {
    skullRef.current?.object3D.scale.set(sizeCoeff, sizeCoeff, sizeCoeff);
  }, [sizeCoeff])

  useEffect(() => {
    const int = setInterval(() => {
      const leftobj = leftHandRef.current?.object3D;
      if (leftobj) {
        const pos = leftobj.position;
        let posOffset_converted = posOffset.clone().applyQuaternion(leftobj.quaternion);
        let skullPos = skullRef.current?.object3D.position
          .set(pos.x + posOffset_converted.x, pos.y + posOffset_converted.y, pos.z + posOffset_converted.z);
        if (skullPos) {
          sphereRef.current?.object3D.position.set(skullPos.x, skullPos.y, skullPos.z);
        }
      }

      const rot = leftHandRef.current?.object3D.quaternion;
      if (rot) {
        let r = rot.clone();
        skullRef.current?.object3D.quaternion.set(r.x, r.y, r.z, r.w).multiply(rotOffset);
      }
    }, 1000/60)

    return () => {
      clearInterval(int)
    }
  }, [posOffset, rotOffset])

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
      /*
      bbuttonup: function () {
        const wrapper = skullRef.current?.object3D;
        const model   = skullRef.current?.object3D.children[0];
        if (model && wrapper) {
          const diff = rightHandRef.current?.object3D.position.clone().sub(wrapper.position);
          if (diff) {
            model.position.sub(diff);
            // setPosOffset(x => x.clone().add(diff));
          }
        }
      }*/
    }

    for (const funcname in eventfuncs) {
      rightHandRef.current?.addEventListener(funcname, eventfuncs[funcname as keyof typeof eventfuncs]);
    }

    return () => {
      for (const funcname in eventfuncs) {
        rightHandRef.current?.removeEventListener(funcname, eventfuncs[funcname as keyof typeof eventfuncs]);
      } 
    }
  }, [])

  return(
    <a-scene xr-mode-ui="enabled: true; XRMode: ar;" ref={sceneRef}>
      <a-entity ref={skullRef}>
        <a-entity gltf-model="url(model.glb)"></a-entity>
      </a-entity>
      <a-sphere ref={sphereRef} color="#f5c0b3" radius="0.008"></a-sphere>
      <a-entity ref={rightHandRef}
        oculus-touch-controls="hand: right"
        vr-calib></a-entity>
      <a-entity ref={leftHandRef}
        oculus-touch-controls="hand: left; model: false;"
        ></a-entity>
    </a-scene>
  );
}

export default MyApp;
