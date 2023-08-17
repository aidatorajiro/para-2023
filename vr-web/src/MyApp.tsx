import React from "react";
import * as AFRAME from 'aframe';
import * as THREE from 'three';

interface MyProps {
}

interface MyState {
    count?: number;
}

class MyApp extends React.Component<MyProps, MyState> {
    constructor(props: MyProps) {
      super(props);
      this.state = {count: 0};
    }
    render () {
      return(
        <h1>現在のカウントは{this.state.count}です</h1>
      );
    }
}

export default MyApp;
