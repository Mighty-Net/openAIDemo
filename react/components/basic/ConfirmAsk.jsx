import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
` 
const CancelBt = styled.div`
color:#222;
height:40px;
width:120px;
border-radius:20px;
border:1px #041429 solid;
justify-content: center;
align-items: center;
margin: 20px 5px;
cursor:pointer;
background-color:#fff;
&:hover {
  background-color:#66a7fc;
  border:1px #fff solid;
  color:#fff
}
` 
const ConfirmBt = styled.div`
color:#fff;
height:40px;
width:120px;
border-radius:20px;
border:1px #041429 solid;
justify-content: center;
align-items: center;
margin: 20px 5px;
cursor:pointer;
background-color:#041429;
&:hover {
  background-color:#66a7fc;
  border:1px #fff solid;
}
` 

const ConfirmAsk = (props) => {
  React.useEffect(() => {

    return () => {
      // unsubscribe
    } 
  },[]);
  const ConfirmText = props.ConfirmText?props.ConfirmText:Helper.trans("miscellaneous.confirmtext");
  const CancelText = props.CancelText?props.CancelText:Helper.trans("miscellaneous.canceltext");
  return (
    <Container style={{...props.style}} className={`flex select-none justify-center items-center ${props.className}`}>
      {props.onCancel?<CancelBt className='flex rbshadow' onClick={()=>{props.onCancel();}}>
        {CancelText}
      </CancelBt>:null}
      <ConfirmBt className='flex rbshadow' style={{opacity:props.disable?0.3:1}} onClick={()=>{if(!props.disable)props.onConfirm();}}>
        {ConfirmText}
      </ConfirmBt>
      

    </Container>
  );
};




export default ConfirmAsk;
