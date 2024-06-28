import React from 'react';
import styled from 'styled-components';
import TextInput from "../components/basic/TextInput";
import Switch from "../components/basic/Switch";
import Fade from "../components/basic/Fade";
import Cross from "../components/basic/Cross";
import { useLoaderData,useNavigate } from 'react-router-dom';
import  secureLocalStorage  from  "react-secure-storage";
import {useSelector, useDispatch } from 'react-redux';
import {setUserInfo} from '../redux/slices/UserInfo'

import iosImage from '../assets/iosimg.png';
import androidImage from '../assets/androidimg.png';

const Container = styled.div`
position:relative;
background-image:url(images/loginbg.jpg);
background-size:cover;
background-position:right;
background-repeat:no-repeat;
justify-content:flex-start;
min-height: 720px;
` 
const Logo = styled.div`
width:150px;
border-radius:50%;
background-color:rgb(255, 255, 255);
padding:15px;
aspect-ratio: 1;
` 

const SignButton = styled.div`
color:#fff;
height:40px;
width:120px;
border-radius:20px;
border:1px #fff solid;
justify-content: center;
align-items: center;
margin: 20px 5px;
cursor:pointer;
background-color:#041429;
&:hover {
  background-color:#66a7fc
}
` 

const Appstore = styled.div`
margin-top: 20px;
` 
const Footer = styled.div`
color:#fff;
white-space: nowrap;
margin-top: 20px;
` 


const Login = (props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const DialogSetting = useSelector(ret_state => ret_state.Dialog.setting);
  const DialogVisble = useSelector(ret_state => ret_state.Dialog.visible);
  const [rememberme,setrememberme] = React.useState(false);
  const [credential,setcredential] = React.useState({uname:"",passwd:""});
  const [funame,setfuname] = React.useState("");
  const [showforgotpasswd,setshowforgotpasswd] = React.useState(false);
  const [suname,setsuname] = React.useState("");
  const [showsingup,setshowsingup] = React.useState(false);
  const ref_uname = React.useRef(null);
  const ref_passwd = React.useRef(null);
  const ref_SignupInput = React.useRef(null);
  const ref_Forgotpasswd = React.useRef(null);

  const browserWidth = document.documentElement.clientWidth;
  const browserHeight = document.documentElement.clientHeight;
  const scrollY = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollX = document.documentElement.scrollLef || document.body.scrollLeft;
  const positionTop = browserHeight/2 - 330/2 + scrollY;

  React.useEffect(() => {
    bootstrap()
    return () => {
    }
  },[]);

  React.useEffect(() => {
    if(DialogSetting.onConfirm)g_onDialogComfirmHandler();
    if(DialogSetting.onCancel)g_onDialogCancelHandler();
    return () => {}
  },[DialogSetting.onConfirm,DialogSetting.onCancel]);

  const bootstrap=async()=>{
    setrememberme(loaderData.rem?true:false);
    setcredential({uname:loaderData.uname?loaderData.uname:"",passwd:loaderData.passwd?loaderData.passwd:""})
    // ref_uname.current?.focus();
  }
  const signInHandler=async()=>{
    // setDialog({title:"123",des:"123js dlksjd laskjf lasdjflksadf aslkfjaklsdfj slakdfj asldfjkalsdfj aslkfdjlksad jflkjsa dflka sjflkjas flk asdlkfj alsdkfjlaskdfj laskdjf slakdjf saldkfj lk "});
    // setDialogVisible(true);
    Helper.removeClass(ref_uname.current,"error");
    Helper.removeClass(ref_passwd.current,"error");
    if(credential.uname==""){
      Helper.addClass(ref_uname.current,"error");
      ref_uname.current.showHint();
      return false;
    }
    else if(credential.passwd==""){
      Helper.addClass(ref_passwd.current,"error");
      ref_passwd.current.showHint();
      return false;
    }
    g_serverCommError = false;
    setScreenLoading(true);
    const response = await serverApi.accountLoginCheck({
      account:credential.uname,
      passwd:credential.passwd
    })
    // console.log(response)
    setScreenLoading(false);
    if(!g_serverCommError){
      if(rememberme){
        Helper.StoreLocalData("aiotportal_uname",credential.uname);
        Helper.StoreLocalData("aiotportal_passwd",credential.passwd);
      }
      dispatch(setUserInfo(response.data));
      navigate('main');
    }
  }
  const signUpHandler=async()=>{
    Helper.removeClass(ref_SignupInput.current,"error");
    if(!suname||!Helper.emailValidate(suname)){
      Helper.addClass(ref_SignupInput.current,"error");
      ref_SignupInput.current.showHint();
      return false;
    }
    g_serverCommError = false;
    const response = await serverApi.signUp({account:suname});
    // console.log(response)
    if(!g_serverCommError){
      setFreezerVisible(false);
      setshowsingup(false);
      setDialog({title:Helper.trans("miscellaneous.SucessText"),des:`A sign up instruction has been sent to ${funame}. Please follow the instruction to complete the account setting.`});
      setDialogVisible(true);
    }
    
  }
  const forgotPWHandler=async()=>{
    Helper.removeClass(ref_Forgotpasswd.current,"error");
    if(!funame||!Helper.emailValidate(funame)){
      Helper.addClass(ref_Forgotpasswd.current,"error");
      ref_Forgotpasswd.current.showHint();
      return false;
    }
    g_serverCommError = false;
    const response = await serverApi.forgotPassword({account:funame});
    // console.log(response)
    if(!g_serverCommError){
      setFreezerVisible(false);
      setshowforgotpasswd(false);
      setDialog({title:" ",des:`A password reset instruction has been sent to ${funame}. Please follow the instruction to complete the password reset.`});
      setDialogVisible(true);
    }
    
  }

  return (<Container className={"w-full h-screen flex flex-col items-center"} >
    <div style={{...styles.frame}}>
      <Logo className="flex select-none">
        <img style={{objectFit:'contain',marginTop:'-10px'}} src="images/mightylogo_g.png"/>
      </Logo>
      <h1 style={{color:"#fff",marginTop:"15px"}} className="text-3xl select-none">MyGPT portal</h1>
      <TextInput style={{marginTop:'20px',width:'300px'}} name="uname" className="fieldValue"
        placeholder="... Account or Email Address"
        value={credential.uname}
        onInput={(text)=>{setcredential({...credential,uname:text})}}
        type="email"
        ref={ref_uname}
        hintMsg="required"
      />
      <TextInput style={{marginTop:'20px',width:'300px'}} name="passwd" className="fieldValue"
        placeholder="... Password"
        value={credential.passwd}
        onInput={(text)=>{setcredential({...credential,passwd:text})}}
        maxLength={20}
        type="password"
        ref={ref_passwd}
        hintMsg="required"
      />
      <div className="flex flex-row">
        <SignButton onClick={signInHandler} tabIndex='0' className="flex select-none text-lg">Sign in</SignButton>
      </div>
      {/* <div style={{cursor:"pointer"}} className="flex flex-row items-center">
        <Switch initState={rememberme} className="flex flex-row items-center" style={{margin:"0 20px 0 0",cursor:"pointer"}} id='sw_1' onCheck={(r)=>{
          secureLocalStorage.setItem("aiotportal_rem",r);
        }}>
          <div style={{cursor:"pointer",marginLeft:"5px"}} className="text-base text-white select-none">Remember Me</div>
        </Switch>
        <div style={{cursor:"pointer"}} className="text-base text-white select-none" onClick={()=>{
          setFreezerVisible(!showsingup);
          setshowforgotpasswd(!showforgotpasswd)
        }}>Forgot Password?</div>
      </div> */}
      {/* <div style={{marginTop:"10px"}}>
        <span className="text-white select-none">Need an account?</span><span onClick={()=>{
          setFreezerVisible(!showsingup);
          setshowsingup(!showsingup)
        }} style={{marginLeft:"5px",cursor:"pointer"}} className="text-white underline select-none" to="/signup">Sign up</span>
      </div> */}
    </div>
    {/* <Appstore className="flex"> 
      <a className="mr-2 cursor-pointer select-none"><img className="select-none cursor-pointer" src={"."+iosImage} width={'195px'}/></a>
      <a className="cursor-pointer select-none"><img className="select-none cursor-pointer" src={"."+androidImage} width={'195px'}/></a>
    </Appstore> */}
    <Footer className='mb-10' id='footer'>
      <span>{
        `v${g_appVersion} © 2024 MIGHT ELECTRONIC CO., LTD. All Rights Reserved.`}
      </span>
    </Footer>
    <Fade onOpen={()=>{}} visible={showsingup} durationIn={500} durationOut={1}  className="flex-col flex items-center" style={{...styles.signup,top:`${positionTop}px`}}>
      <Cross style={{position:'absolute',right:'1%',top:'1%'}} onClick={()=>{setshowsingup(!showsingup);setFreezerVisible(false);}}/>
      <h1 className="text-2xl mt-4 mb-4 font-bold">Sign Up</h1>
      <div className="text-center text-lg">Please use your work email address, so we can connect you in Mighty Link.</div>
      <div className="text-slate-400 mt-5 self-start">Email Address</div>
      <TextInput className="self-start fieldValue" style={{marginTop:'5px',width:'100%'}} name="uname"
        placeholder="..."
        value={suname}
        onInput={(text)=>{setsuname(text)}}
        type="email"
        ref={ref_SignupInput}
        hintMsg="Please enter correct email address"
      />
      <SignButton onClick={signUpHandler} tabIndex='0' className="flex select-none text-lg">Sign up</SignButton>
    </Fade>
    <Fade onOpen={()=>{}} visible={showforgotpasswd} durationIn={500} durationOut={1} className="flex-col flex items-center" style={{...styles.signup,top:`${positionTop}px`}}>
      <Cross style={{position:'absolute',right:'1%',top:'1%'}} onClick={()=>{setshowforgotpasswd(!showforgotpasswd);setFreezerVisible(false);}}/>
      <h1 className="text-2xl mt-4 mb-4 font-bold">Forgot your password?</h1>
      <div className="text-center text-lg">Please enter the email address below, we will send you the password reset instruction.</div>
      <div className="text-slate-400 mt-5 self-start">Email Address</div>
      <TextInput className="self-start fieldValue" style={{marginTop:'5px',width:'100%'}} name="uname"
        placeholder="..."
        value={funame}
        onInput={(text)=>{setfuname(text)}}
        type="email"
        ref={ref_Forgotpasswd}
        hintMsg="Please enter correct email address"
      />
      <SignButton onClick={forgotPWHandler} tabIndex='0' className="flex select-none text-lg">Send</SignButton>
    </Fade>
</Container>)
}

const styles = {
  frame:{
    // height:'400px',
    marginTop:'80px',
    justifyContent:'flex-start',
    alignItems: "center",
    display:"flex",
    flexDirection:'column',
    backgroundColor: "rgba(10,26,47,0.8)",
    border:"1px solid rgb(56 59 64)",
    borderRadius:"10px",
    padding:'20px 0',
    width:'400px'
  },
  signup:{
    position:'absolute',
    width:'400px',
    height:'330px',
    backgroundColor:"#fefefe",
    margin: "auto",
    borderRadius:'6px',
    padding:'20px',
    zIndex:100,
    "WebkitBoxShadow":"4px 8px 16px 2px rgba(0,0,0,0.7)",
    "boxShadow":"4px 8px 16px 2px rgba(0,0,0,0.7)"
  }
};


export default Login;
