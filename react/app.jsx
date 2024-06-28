require('./bootstrap');
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  redirect
} from "react-router-dom";
import styled from 'styled-components';
import store from './redux/store'
import { Provider,useSelector, useDispatch } from 'react-redux'
import {setUserInfo} from './redux/slices/UserInfo'
import  secureLocalStorage  from  "react-secure-storage";
import Loading from './components/basic/Loading';
import Dialog from './components/basic/Dialog';
import Login from "./routes/Login";
import MainEntry from "./routes/MainEntry";


function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const router = createBrowserRouter([
  {
    path: "",
    element: <Login />,
    loader: async () => {
      return {
        uname:secureLocalStorage.getItem("aiotportal_uname"),
        passwd:secureLocalStorage.getItem("aiotportal_passwd"),
        rem:secureLocalStorage.getItem("aiotportal_rem")
      }
    },
  },
  {
    path: "main",
    element: <MainEntry />,
    loader: async (e) => {
      g_serverCommError = false;
      const response = await serverApi.userValidation();
      if(!g_serverCommError){
        store.dispatch(setUserInfo(response.data));
      }
      return {path:""};
    },
  }
],{
  basename: "",
});

const Freezer =  styled.div`
width:100%;height:100%;
position:fixed;top:0px;left:0px;
z-index:99;
background-color:rgba(0,0,0,0.8);
` 

export default function App() {
  const freezerVisible = useSelector(ret_state => ret_state.Dialog.freezer); 
  const LoadingVisible = useSelector(ret_state => ret_state.Loading.isLoading); 
  const LoadingTitle = useSelector(ret_state => ret_state.Loading.title); 
  const LoadingWait = useSelector(ret_state => ret_state.Loading.isWait); 
  const DialogSetting = useSelector(ret_state => ret_state.Dialog.setting);
  const DialogVisble = useSelector(ret_state => ret_state.Dialog.visible);
  React.useEffect(() => {
    document.title = webTitle;

    // $.ajaxSetup({headers: {'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')}});
    const csrfToken = document.querySelector(`meta[name="csrf-token"]`).attributes.content.value;
    Helper.StoreLocalData("csrfToken",csrfToken);
    return () => {
    }
  },[]);

return (<React.StrictMode>
  {freezerVisible?<Freezer/>:null}
  <Loading onCancel={()=>g_onLoadingCancelHandler()} wait={LoadingWait} title={LoadingTitle} visible={LoadingVisible}/>
  <Dialog visible={DialogVisble} setting={DialogSetting}/>
  <RouterProvider router={router} />
</React.StrictMode>);
}

const container = document.getElementById('appContent');
const root = createRoot(container); 
root.render(<Provider store={store}><App /></Provider>);
