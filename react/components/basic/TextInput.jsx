import React,{useImperativeHandle,useRef} from 'react';
import styled from 'styled-components';
import { animated, useSpring } from '@react-spring/web'

const Input = styled.input`
  height:40px;
  width:100%;
  background-color:#fff;
  border-radius:10px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 1.2rem; /* 18px */
  line-height: 1.5rem; /* 24px */
  font-weight: 300;
  padding: 2px 10px;
  transition: border .3s linear;
  -webkit-transition: border .3s linear;
  -moz-transition: border .3s linear;
  -o-transition: border .3s linear;
  border:3px solid #d6d6d6;
  &:focus {
    border-color:#66a7fc;
  }
  &.error:focus {
    border-color:red;
  }
` 
// display:none;
const ErrorView = styled.input`
position: absolute;
width: fit-content;
background-color: #555;
padding: 5px;
height: 20px;
top: 10px;
right: -5%;
border-radius: 6px;
color: #fff;
&:after{
  content: "";
  border-top: 5px solid transparent;
  position: absolute;
  border-bottom: 5px solid transparent;
  border-left: 5px solid transparent;
  border-right: 5px solid #555;
  left: -9px;
}
`

const TextInput = (props,myref) => {
  const [hintVisible,sethintVisible] = React.useState(false);
  const inputRef = useRef(null);
  const animatedStyles = useSpring({
    opacity: hintVisible ? 1 : 0,
    config: {
      duration: 100,
    },
  })
  // if(myref!==undefined)myref = React.createRef()

  React.useEffect(() => {
    return () => {
    }
  },[]);

  // React.useEffect(() => {
  //   if(DialogSetting.onConfirm)g_onDialogComfirmHandler();
  //   if(DialogSetting.onCancel)g_onDialogCancelHandler();
  //   return () => {}
  // },[DialogSetting.onConfirm,DialogSetting.onCancel]);
  const showHint=()=>{
    sethintVisible(true)
  }
  const hideHint=()=>{
    sethintVisible(false)
  }

  useImperativeHandle(myref, () => {
    inputRef.current.showHint=showHint;
    inputRef.current.hideHint=hideHint;
    return inputRef.current
  }, []);

  return (
    <div style={{position:'relative',...props.style}}>
      <Input id={props.id} className={props.className} style={{...props.textStyle}}
        ref={inputRef}
        value={props.value==undefined?"":props.value}
        placeholder={props.placeholder==undefined?null:props.placeholder}
        maxLength={props.maxLength==undefined?null:props.maxLength}
        name={props.name==undefined?null:props.name}
        readOnly={props.readOnly==undefined?false:props.readOnly}
        type={props.type==undefined?"text":props.type}
        pattern={props.pattern==undefined?null:props.pattern}
        onInput={(e)=>{
          if(!e.target.validity.valid&&props.pattern)return false;
          if(props.onInput)props.onInput(e.target.value)
        }}
        onFocus={(e)=>{hideHint();if(props.onFocus)props.onFocus()}}
        onBlur={(e)=>{if(props.onBlur)props.onBlur()}}
      />
      {props.hintMsg&&hintVisible?<ErrorView as={animated.div} style={animatedStyles} className="text-sm flex items-center">
        {props.hintMsg}
      </ErrorView>:null}
    </div>
  )
}

const styles = {
};


export default React.forwardRef(TextInput);
