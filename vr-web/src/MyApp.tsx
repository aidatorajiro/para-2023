/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import * as AFRAME from 'aframe';
import {send_log} from './utils';

const THREE = AFRAME.THREE

const MyApp = function () {
  const sceneRef = React.createRef();
  const skullRef = React.createRef<AFRAME.Entity>();
  const rightHandRef = React.createRef<AFRAME.Entity>();
  const leftHandRef = React.createRef<AFRAME.Entity>();
  const [sizeCoeffs, setSizeCoeffs] = useState<THREE.Vector3>(new THREE.Vector3(0.5, 0.5, 0.5));
  const [posOffset, setPosOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [rotOffset, setRotOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [caribrationA, setCaribrationA] = useState<boolean>(false);

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

          send_log({m: 'start calib A'})
          setCaribrationA(true)
        },
        gripup: function () {
          if (ended) { return }

          send_log({m: 'end calib A'})
          setCaribrationA(false)
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
