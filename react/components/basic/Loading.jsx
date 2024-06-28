import React from 'react';
import styled from 'styled-components';
import {useSelector, useDispatch } from 'react-redux';

import loadingImage from '../../assets/loading-90.gif';

const Freezer =  styled.div`
width:100%;height:100%;
position:fixed;top:0px;left:0px;
z-index:9999;
background-color:rgba(0,0,0,0.8);
display:flex;align-items:center;
` 

const Container = styled.div`
margin:auto;width:120px;height:120px;
border: 1px solid #777;
border-radius: 10px;
overflow: hidden;
-webkit-box-shadow:4px 8px 16px 2px rgba(0,0,0,0.7);
box-shadow:4px 8px 16px 2px rgba(0,0,0,0.7);
` 
const TitleDiv = styled.div`
height:40px;
` 
const ImgFrame = styled.div`
width: 150px;
height: 150px;
align-self: center;
display: flex;
` 


const Loading = (props) => {
  const screenLoadingTimeout = React.useRef(null);
  const [isVisible,setisVisible] = React.useState(false);
  const [status,setstatus] = React.useState("unmounted");

  React.useEffect(() => {
    if(props.visible){
      if(status==="unmounted"){
        setstatus("mount");
      }
    }
    setisVisible(props.visible)

    if(props.visible==false){
      clearTimeout(screenLoadingTimeout.current);
      screenLoadingTimeout.current = null;
      g_onLoadingCancelHandler = ()=>{};
      setstatus("unmounted");
    } 
    else{
      if(!props.wait)
        screenLoadingTimeout.current = setTimeout(()=>{setisVisible(false);setstatus("unmounted");},g_serverTimeout);
    }
    return () => {
      // actions to be performed when component unmounts
    }
  },[props.visible]);
  
  return (
    status!=="unmounted"?<Freezer>
    <Container style={{...props.style}} className="flex items-end justify-center">
      {props.title?<TitleDiv className="select-none font-bold flex items-center justify-center text-2xl">{Title}</TitleDiv>:null}
      <ImgFrame><img className="select-none aspect-square object-cover w-full h-full" src={loadingImage} /></ImgFrame>
    </Container>
    </Freezer>:null
  )

}


export default Loading


const styles = {
}
