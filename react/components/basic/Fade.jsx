import React from 'react';
import { animated, useSpring } from '@react-spring/web'

const UNMOUNTED = "unmounted";
const EXITED = "exited";
const ENTERING = "entering";
const ENTERED = "entered";
const EXITING = "exiting";

const transitionStyles = {
  entering: { opacity: 0 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 }
};


const Fade = (props) => {
  const duration = (props.duration?props.duration:200);
  const durationIn = props.durationIn?(props.durationIn):duration;
  const durationOut = props.durationOut?props.durationOut:(duration);
  const [isVisible,setisVisible] = React.useState(false);
  const [status,setstatus] = React.useState("unmounted");

  const animatedStyles = useSpring({
    opacity: isVisible ? 1 : 0,
    config: {
      duration: !props.visible?durationOut:durationIn,
    },
    onRest: (e) => {
      if(!e.finished)return false;
      if(!isVisible){
        setstatus("unmounted");
        if(props.onClose)props.onClose();
      }
      else{
        if(props.onOpen)props.onOpen();
      }
    },
  })

  React.useEffect(() => {
    if(props.visible){
      if(status==="unmounted"){
        setstatus("mount");
      }
    }
    setisVisible(props.visible)
    return () => {
    }
  },[props.visible]);
  

  return (
    status==="unmounted"?null:<animated.div className={props.className} style={{...animatedStyles,...props.style,
  }}>
    {props.children}
  </animated.div>
  )
}

const styles = {
};


export default Fade;
