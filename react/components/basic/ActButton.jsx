import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
cursor:pointer;
padding: 5px;
background-color: #c00;
color: #fff;
border-radius: 6px;
min-height: 40px;
min-width: 80px;
` 

const ActButton = (props,myref) => {

  React.useEffect(() => {
    return () => {
    }
  },[]);


  return (<Container
    id={props.id}
    className={`flex select-none justify-center items-center self-start rbshadow ${props.className}`}
    style={{...props.style}}
    onClick={()=>{if(props.onClick)props.onClick()}}
  >
    {props.text}
  </Container>
  )
}

const styles = {
};


export default React.forwardRef(ActButton);
