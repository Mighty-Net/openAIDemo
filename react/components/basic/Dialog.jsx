import React from 'react';
import styled from 'styled-components';
import {useSelector,useDispatch} from 'react-redux'
import { animated, useSpring } from '@react-spring/web'

const Freezer =  styled.div`
width:100%;height:100%;
position:fixed;top:0px;left:0px;
z-index:9999;
background-color:rgba(0,0,0,0.8);
display:flex;align-items:center;
` 

const Container = styled.div`
width:50%;min-width:400px;
background-image: linear-gradient(to right top, #ed4559, #d94944, #c44c31, #ae4e21, #994e14);
margin:auto;
border-radius: 2px;
z-index:10000;
-webkit-box-shadow:4px 8px 16px 2px rgba(0,0,0,0.7);
box-shadow:4px 8px 16px 2px rgba(0,0,0,0.7);
padding:10px 20px;
color:#fff;
` 
const Button = styled.span`
height:40px;min-width:100px;
border:1px solid #fff;
border-radius: 20px;
margin:0 5px;
background-color: #aaa;
padding:0 5px;
&:hover{
  background-image: linear-gradient(to right top, #8f3038, #943630, #983d28, #99451f, #994e14);
}
` 
const TitleDiv = styled.div`
height:40px;
` 
const DesDiv = styled.div`
max-height:200px;
overflow: auto;
` 


const Dialog = (props) => {
  const dispatch = useDispatch();
  const DialogSetting = useSelector(ret_state => ret_state.Dialog.setting);
  const [isVisible,setisVisible] = React.useState(false);
  const [status,setstatus] = React.useState("unmounted");

  const browserWidth = document.documentElement.clientWidth;
  const browserHeight = document.documentElement.clientHeight;
  const scrollY = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollX = document.documentElement.scrollLef || document.body.scrollLeft;
  const positionTop = browserHeight/2 - 200/2 + scrollY;

  const animatedStyles = useSpring({
    opacity: isVisible ? 1 : 0,
    config: {
      duration: 200,
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
      // unsubscribe
    } 
  },[props.visible]);
  const ConfirmText = props.setting.ConfirmText?props.setting.ConfirmText:Helper.trans("miscellaneous.confirmtext");
  const CancelText = props.setting.CancelText?props.setting.CancelText:Helper.trans("miscellaneous.canceltext");
  const Title = props.setting.title;
  const Des = props.setting.des;
  // 0 -> 一個按鈕
  // 1 -> 兩個按鈕

  const onConfirm=()=>{
    g_onDialogCancelHandler = ()=>{};
    setDialog({...DialogSetting,onConfirm:true,onCancel:null})
    setDialogVisible(false);
  }
  const onCancel=()=>{
    g_onDialogComfirmHandler = ()=>{};
    setDialog({...DialogSetting,onConfirm:null,onCancel:true})
    setDialogVisible(false);
  }

  return (status!=="unmounted"?<Freezer>
  <Container positiontop={positionTop} as={animated.div} style={{...animatedStyles,...props.style}} className="flex flex-col">
    {Title?<TitleDiv className="select-none font-bold flex items-center justify-center text-2xl">{Title}</TitleDiv>:null}
    {Des?<DesDiv className="flex text-lg mb-3 justify-center ">{Des}</DesDiv>:null}
    <div className="justify-center flex mb-3">
      {props.setting.type?<Button onClick={onCancel} className="cursor-pointer select-none text-lg flex items-center justify-center">{CancelText}</Button>:null}
      <Button onClick={onConfirm}  className="cursor-pointer select-none text-lg flex items-center justify-center">{ConfirmText}</Button>
    </div>
  </Container></Freezer>:null
  );
};



const styles = {
}

export default Dialog;
