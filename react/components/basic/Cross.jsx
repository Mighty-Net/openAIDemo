import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus
} from "@fortawesome/free-solid-svg-icons";


const Container = styled.div`
cursor:pointer;
& * {cursor:pointer}
` 
const Cross = (props) => {

  const clickHandel=()=>{
    if(props.onClick)props.onClick()
  }
  return <Container onClick={clickHandel} style={{...props.style}}><FontAwesomeIcon icon={faPlus} color="#222" size="2xl" transform={{rotate:45}} /></Container>
}

export default Cross;
