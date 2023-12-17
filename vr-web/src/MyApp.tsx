import React from "react";
import * as AFRAME from 'aframe';
const THREE = AFRAME.THREE

const MyApp = function () {
  let skullRef = React.createRef();

  return(
    <section>
      <a-scene>
        <a-sky color="#ECECEC"></a-sky>
        <a-gltf-model src="model.glb" position="0 0 0" ref={skullRef}></a-gltf-model>
      </a-scene>
    </section>
  );
}

export default MyApp;
