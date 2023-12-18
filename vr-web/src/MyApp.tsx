/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import * as AFRAME from 'aframe';
import {send_log} from './utils';

const THREE = AFRAME.THREE

const MyApp = function () {
  const COEFF_CALIB_POS = 0.33;
  const COEFF_CALIB_ROT = 0.33;
  const COEFF_CALIB_SIZE = 0.33;

  const [sizeCoeff, setSizeCoeff] = useState<number>(0.5);
  const [posOffset, setPosOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [rotOffset, setRotOffset] = useState<THREE.Euler>(new THREE.Euler(0, 0, 0, THREE.Euler.DEFAULT_ORDER));
  const [calibrationGrip, setCalibrationGrip] = useState<boolean>(false);
  const [calibrationTrigger, setCalibrationTrigger] = useState<boolean>(false);
  const [calibrationA, setCalibrationA] = useState<boolean>(false);

  const sceneRef = React.useRef<AFRAME.Scene>();
  const skullRef = React.useRef<AFRAME.Entity>();
  const rightHandRef = React.useRef<AFRAME.Entity>();
  const leftHandRef = React.useRef<AFRAME.Entity>();

  const [posHistory, setPosHistory] = React.useState<THREE.Vector3[]>([]);
  const [rotHistory, setRotHistory] = React.useState<THREE.Euler[]>([]);
  useEffect(() => {
    const int = setInterval(() => {
      if (calibrationGrip || calibrationTrigger || calibrationA) {
        const currentPos = rightHandRef.current?.object3D.position.clone();
        if (currentPos) {
          setPosHistory(x => [...x, currentPos]);
        }

        const currentRot = rightHandRef.current?.object3D.rotation.clone();
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
  }, [calibrationGrip, calibrationTrigger, calibrationA])

  useEffect(() => {
    if (calibrationTrigger) {
      if (posHistory.length > 2) {
        const newdata = posHistory[posHistory.length - 1]
        const olddata = posHistory[posHistory.length - 2]
        const diff = newdata.clone().sub(olddata).multiplyScalar(COEFF_CALIB_POS)
        setPosOffset(x => x.clone().add(diff))
      }
    }
    if (calibrationGrip) {
      if (rotHistory.length > 2) {
        const newdata = rotHistory[rotHistory.length - 1]
        const olddata = rotHistory[rotHistory.length - 2]
        const diff = [
          (newdata.x - olddata.x) * COEFF_CALIB_ROT,
          (newdata.y - olddata.y) * COEFF_CALIB_ROT,
          (newdata.z - olddata.z) * COEFF_CALIB_ROT
        ];
        setRotOffset(obj => new THREE.Euler(obj.x + diff[0], obj.y + diff[1], obj.z + diff[2]))
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
            const diff = newdata.clone().sub(olddata).dot(normal);
            setSizeCoeff(x => x + diff)
          }
        }
      }
    }
  }, [calibrationGrip, calibrationTrigger, calibrationA, posHistory, rotHistory])

      /*
      if (calibrationGrip) {
        const currentRot = rightHandRef.current?.object3D.rotation;
        if (lastRot === undefined) {
          lastRotRef.current = currentRot;
        } else if (currentRot !== undefined) {
          const diff = [
            currentRot.x - lastRot.x,
            currentRot.y - lastRot.y, 
            currentRot.z - lastRot.z
          ];
          send_log({message: "calib rot diff", diff})
          setRotOffset(obj => new THREE.Euler(obj.x + diff[0], obj.y + diff[1], obj.z + + diff[2], THREE.Euler.DEFAULT_ORDER))
        }
      }

      if (calibrationA) {
        const currentPos = rightHandRef.current?.object3D.position;
        if (lastPos === undefined) {
          lastPosRef.current = currentPos;
        } else if (currentPos !== undefined) {
          const diff = currentPos.clone().sub(lastPos);
          send_log({message: "calib size diff", diff})
          setSizeCoeffs(x => x.clone().add(diff.multiplyScalar(COEFF_CALIB_POS)))
        }
      }*/

  useEffect(() => {
    skullRef.current?.object3D.scale.set(sizeCoeff, sizeCoeff, sizeCoeff);
  }, [sizeCoeff])

  useEffect(() => {
    const int = setInterval(() => {
      const pos = leftHandRef.current?.object3D.position;
      if (pos) {
        skullRef.current?.object3D.position.set(pos.x + posOffset.x, pos.y + posOffset.y, pos.z + posOffset.z);
      }

      const rot = leftHandRef.current?.object3D.rotation;
      if (rot) {
        skullRef.current?.object3D.rotation.set(rot.x + rotOffset.x, rot.y + rotOffset.y, rot.z + rotOffset.z)
      }
    }, 1000/60)

    return () => {
      clearInterval(int)
    }
  }, [posOffset, rotOffset])

  useEffect(() => {
    const eventfuncs = {
        gripdown: function() {
          send_log({message: 'start calib (Grip)'})
          setCalibrationGrip(true)
        },
        gripup: function () {
          send_log({message: 'end calib (Grip)'})
          setCalibrationGrip(false)
        },
        triggerdown: function () {
          send_log({message: 'start calib (Trigger)'})
          setCalibrationTrigger(true)
        },
        triggerup: function () {
          send_log({message: 'end calib (Trigger)'})
          setCalibrationTrigger(false)
        },
        abuttondown: function () {
          send_log({message: 'start calib (A)'})
          setCalibrationA(true)
        },
        abuttonup: function () {
          send_log({message: 'end calib (A)'})
          setCalibrationA(false)
        }
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
            <a-entity gltf-model="url(model.glb)" ref={skullRef}></a-entity>

            <a-entity ref={rightHandRef}
              hand-controls="hand: right"
              laser-controls="hand: right"
              oculus-touch-controls="hand: right"
              vr-calib></a-entity>
            
            <a-entity ref={leftHandRef}
              hand-controls="hand: left"
              laser-controls="hand: left"
              oculus-touch-controls="hand: left"
              ></a-entity>
          </a-scene>
  );
}

export default MyApp;
