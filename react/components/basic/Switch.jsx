import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
width: 45px;
height: 20px;
border: 1px solid #fff;
border-radius: 20px;
background-color: ${props=>props.checked?"#66a7fc":"#aaa"};
cursor: pointer;
-webkit-transition: all .5s cubic-bezier(.23,1,.32,1);
transition: all .5s cubic-bezier(.23,1,.32,1);
` 

const Circle = styled.span`
display: block;
height: 16px;
width: 16px;
border-radius: 50%;
background-color: white;
margin-left: ${props=>props.checked?"26px":"1px"};
margin-top: 1px;
-webkit-transition: all .5s cubic-bezier(.23,1,.32,1);
transition: all .5s cubic-bezier(.23,1,.32,1);
-moz-box-shadow: 0 2px 10px rgba(0, 0, 0, .2);
-webkit-box-shadow: 0 2px 10px rgb(0 0 0 / 20%);
box-shadow: 0 2px 10px rgb(0 0 0 / 20%);
cursor: pointer;
` 

const Switch = (props) => {
  const [checked,setchecked] = React.useState(false);
  React.useEffect(() => {
    setchecked(props.initState)
    return () => {
    }
  },[props.initState]);

  const handleClick=()=>{
    setchecked(!checked)
    if(props.onCheck)props.onCheck(!checked);
  };

  return (
    <div onClick={handleClick} className={props.className} style={{...props.style}}>
      <Container checked={checked} id={props.id}>
        <Circle checked={checked} />
      </Container>
      {props.children}
    </div>
  )
}

const styles = {
};


export default Switch;
