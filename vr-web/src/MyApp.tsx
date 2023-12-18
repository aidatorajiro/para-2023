/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import * as AFRAME from 'aframe';
import {send_log} from './utils';

const THREE = AFRAME.THREE

const MyApp = function () {
  const COEFF_CALIB_POS = 0.33;
  const COEFF_CALIB_ROT = 0.33;
  const COEFF_CALIB_SIZE = 0.33;

  const [sizeCoeffs, setSizeCoeffs] = useState<THREE.Vector3>(new THREE.Vector3(0.5, 0.5, 0.5));
  const [posOffset, setPosOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [rotOffset, setRotOffset] = useState<THREE.Euler>(new THREE.Euler(0, 0, 0, THREE.Euler.DEFAULT_ORDER));
  const [calibrationGrip, setCalibrationGrip] = useState<boolean>(false);
  const [calibrationTrigger, setCalibrationTrigger] = useState<boolean>(false);
  const [calibrationA, setCalibrationA] = useState<boolean>(false);

  const sceneRef = React.useRef<AFRAME.Scene>();
  const skullRef = React.useRef<AFRAME.Entity>();
  const rightHandRef = React.useRef<AFRAME.Entity>();
  const leftHandRef = React.useRef<AFRAME.Entity>();

  const lastPosRef = React.useRef<THREE.Vector3>();
  const lastRotRef = React.useRef<THREE.Euler>();
  useEffect(() => {
    const int = setInterval(() => {
      if (calibrationTrigger) {
        const lastPos = lastPosRef.current;
        const currentPos = rightHandRef.current?.object3D.position;
        if (lastPos === undefined) {
          lastPosRef.current = currentPos;
        } else if (currentPos !== undefined) {
          const diff = currentPos.clone().sub(lastPos);
          setPosOffset(x => x.clone().add(diff.multiplyScalar(COEFF_CALIB_POS)))
        }
      }

      if (calibrationGrip) {
        const lastRot = lastRotRef.current;
        const currentRot = rightHandRef.current?.object3D.rotation;
        if (lastRot === undefined) {
          lastRotRef.current = currentRot;
        } else if (currentRot !== undefined) {
          const diff = [
            currentRot.x - lastRot.x,
            currentRot.y - lastRot.y, 
            currentRot.z - lastRot.z
          ];
          setRotOffset(obj => new THREE.Euler(obj.x + diff[0], obj.y + diff[1], obj.z + + diff[2], THREE.Euler.DEFAULT_ORDER))
        }
      }

      if (calibrationA) {
        const lastPos = lastPosRef.current;
        const currentPos = rightHandRef.current?.object3D.position;
        if (lastPos === undefined) {
          lastPosRef.current = currentPos;
        } else if (currentPos !== undefined) {
          const diff = currentPos.clone().sub(lastPos);
          setSizeCoeffs(x => x.clone().add(diff.multiplyScalar(COEFF_CALIB_POS)))
        }
      }
    }, 1000/60)

    return () => {
      clearInterval(int)
    }
  }, [calibrationTrigger, calibrationGrip, calibrationA])

  useEffect(() => {
    skullRef.current?.object3D.scale.set(sizeCoeffs.x, sizeCoeffs.y, sizeCoeffs.z);
  }, [sizeCoeffs])

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
    let ended = false;

    AFRAME.registerComponent('vr-calib', {
      init: function () { },
      events: {
        gripdown: function() {
          if (ended) { return }
          send_log({message: 'start calib (Grip)'})
          setCalibrationGrip(true)
        },
        gripup: function () {
          if (ended) { return }
          send_log({message: 'end calib (Grip)'})
          setCalibrationGrip(false)
        },
        triggerdown: function () {
          if (ended) { return }
          send_log({message: 'start calib (Trigger)'})
          setCalibrationTrigger(true)
        },
        triggerup: function () {
          if (ended) { return }
          send_log({message: 'end calib (Trigger)'})
          setCalibrationTrigger(false)
        },
        abuttondown: function () {
          if (ended) { return }
          send_log({message: 'start calib (A)'})
          setCalibrationA(true)
        },
        abuttonup: function () {
          if (ended) { return }
          send_log({message: 'end calib (A)'})
          setCalibrationA(false)
        }
      }
    });

    return () => {
      ended = true;
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
