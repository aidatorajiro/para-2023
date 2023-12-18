import React, { useEffect, useState } from "react";
import * as AFRAME from 'aframe';
import {send_log} from './utils';

const THREE = AFRAME.THREE

const MyApp = function () {
  let sceneRef = React.createRef();
  let skullRef = React.createRef<AFRAME.Entity>();
  let rightHandRef = React.createRef<AFRAME.Entity>();
  let leftHandRef = React.createRef<AFRAME.Entity>();
  let [sizeCoeffs, setSizeCoeffs] = useState<THREE.Vector3>(new THREE.Vector3(1, 1, 1));
  let [posOffset, setPosOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  let [rotOffset, setRotOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  let [caribrationA, setCaribrationA] = useState<boolean>(false);

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

    let int = setInterval(() => {
      if (ended) { return }

      let pos = leftHandRef.current?.object3D.position;
      if (pos) {
        skullRef.current?.object3D.position.set(pos.x, pos.y, pos.z);
      }
    }, 1000/60)

    return () => {
      ended = true;
      clearInterval(int)
    }
  }, [])

  return(
          <a-scene xr-mode-ui="enabled: true; XRMode: ar;" ref={sceneRef}>
            <a-entity gltf-model="url(model.glb)" ref={skullRef} scale="0.4 0.4 0.4"></a-entity>

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
