import React, { RefObject } from "react";
import * as AFRAME from 'aframe';
const THREE = AFRAME.THREE
import styles from './MainStyle.sass';
import { Entity } from "aframe";

interface CommData {
  calibration_status: [number, number, number, number]
  linear_acceleration: [number, number, number]
  quaternion: [number, number, number, number]
}

interface MyProps {
}

interface MyState {
}

class MyApp extends React.Component<MyProps, MyState> {
    websocket: WebSocket | undefined
    check_ws_timer: NodeJS.Timeout | undefined
    skullRef: RefObject<Entity>

    constructor(props: MyProps) {
      super(props);
      this.skullRef = React.createRef();
    }

    componentDidMount() {
      this.websocket = new WebSocket('ws://localhost:3001')

      this.check_ws_timer = setInterval(() => {   
        if (this.websocket?.readyState === WebSocket.CLOSED) {
          console.log("reopening ws")
          this.websocket = new WebSocket('ws://localhost:3001')
        }
      }, 1000);

      let obj = this.skullRef.current?.object3D;
      this.websocket.addEventListener('message', (e) => {
        let d: CommData[] = JSON.parse(e.data)
        let latest = d[0]
        obj?.setRotationFromQuaternion(new THREE.Quaternion(latest.quaternion[1], -latest.quaternion[0], -latest.quaternion[2], latest.quaternion[3]))
        console.log(latest.quaternion)
      })
    }
  
    componentWillUnMount() {
      clearInterval(this.check_ws_timer);
    }
    
    render () {
      return(
        <section>
          <a-scene>
            <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9"></a-box>
            <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>
            <a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>
            <a-plane position="0 0 -4" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>
            <a-sky color="#ECECEC"></a-sky>
            <a-gltf-model src="skull_downloadable.glb" position="0 0 0" ref={this.skullRef}></a-gltf-model>
          </a-scene>
        </section>
      );
    }
}

export default MyApp;
