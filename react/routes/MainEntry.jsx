import React from 'react';
import styled from 'styled-components';
import { useLoaderData,useNavigate,Outlet,Link} from 'react-router-dom';
import {useSelector, useDispatch } from 'react-redux';
import TextInput from "../components/basic/TextInput";
import BlockInput from "../components/basic/BlockInput";
import ActButton from "../components/basic/ActButton";

import AIstar from '../assets/AIstar.png';

const Container = styled.div`

` 
const ControlFrame = styled.div`
width:99%;
border:2px solid #ddd;border-radius:12px;
gap: 12px;
padding: 12px 0;margin-bottom:12px
`
const ControlItem = styled.div`
border-radius:12px;
padding:10px;background-color:#674cE9;
width:49%;height:100%;
@media (max-width: 800px) {
  width:100%;
  height:fit-content
}
`
const ItemTitle = styled.div`
font-size:18px;margin-right:5px;margin-left:5px;
white-space:nowrap;font-weight:bold;color:#fff

`
const MsgResult = styled.div`
border:2px solid #ddd;border-radius:12px;
background-color:#555;height:400px;overflow: auto;
color:#fff;padding:5px;
`

const EmbRecords = styled.div`
height:195px;
padding:5px;min-width:400px;
border-radius:12px;max-width:50%;color:#fff;
@media (max-width: 840px) {
  max-width:100%;
}
`

const Footer = styled.div`
color:#222;
white-space: nowrap;
` 

const MainEntry = (props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  // console.log(loaderData)
  const DialogSetting = useSelector(ret_state => ret_state.Dialog.setting);
  const DialogVisble = useSelector(ret_state => ret_state.Dialog.visible);
  const UserInfo = useSelector(ret_state => ret_state.UserInfo);
  const [settings,setsettings] = React.useState(UserInfo.settings?JSON.parse(UserInfo.settings):{
    temp:"",
    maxToken:"",
    stopSeq:"",
    topP:"",
    frequencyP:"",
    presenceP:"",
    embTopP:"",
    systemPrompt:"",
  });
  const [embeddings,setembeddings] = React.useState([]);
  const [embeddingTextLength,setembeddingTextLength] = React.useState(0);
  // console.log(UserInfo)
  const [infoData,setinfoData] = React.useState({
    temp:{value:""},
    maxToken:{value:""},
    stopSeq:{value:""},
    topP:{value:""},
    frequencyP:{value:""},
    presenceP:{value:""},
    embs:{value:""},
    embTopP:{value:""},
    systemPrompt:{value:""},
    userPrompt:{value:""},
  })
  const [genOutput,setgenOutput] = React.useState("");
  const [generating,setgenerating] = React.useState(false);
  const genOutputAbort = React.useRef(false);
  const lastAssistantContent = React.useRef("");
  const lastUserContent = React.useRef("");

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
    // ref_uname.current?.focus();
    getEmbeddings();
    setinfoData({...infoData,
      temp:{...infoData.temp,value:settings.temp},
      maxToken:{...infoData.temp,value:settings.maxToken},
      stopSeq:{...infoData.temp,value:settings.stopSeq},
      topP:{...infoData.temp,value:settings.topP},
      frequencyP:{...infoData.temp,value:settings.frequencyP},
      presenceP:{...infoData.temp,value:settings.presenceP},
      embTopP:{...infoData.temp,value:settings.embTopP},
      systemPrompt:{...infoData.temp,value:settings.systemPrompt},
    });
  }

  const SaveSystemPrompt = async()=>{
    if(infoData.systemPrompt.value=="")return false;
    g_serverCommError = false;
    setScreenLoading(true);
    const response = await serverApi.SaveSystemPrompt({
      infoData:infoData,
      UID:UserInfo.UID
    })
    setScreenLoading(false);
    if(!g_serverCommError){
      setinfoData({...infoData,
        temp:{...infoData.temp,value:response.settings.temp},
        maxToken:{...infoData.temp,value:response.settings.maxToken},
        stopSeq:{...infoData.temp,value:response.settings.stopSeq},
        topP:{...infoData.temp,value:response.settings.topP},
        frequencyP:{...infoData.temp,value:response.settings.frequencyP},
        presenceP:{...infoData.temp,value:response.settings.presenceP},
        embTopP:{...infoData.temp,value:response.settings.embTopP},
      });
    }
  }

  const EmbeddingsTransform = async()=>{
    if(infoData.embs.value=="")return false;
    if(infoData.embs.value.length>8191){
      setDialog({title:Helper.trans("miscellaneous.WarnText"),des:"文字輸入最大為 8191 個字元。"});
      setDialogVisible(true);
      return false;
    }
    // console.log(infoData.embs.value)
    g_serverCommError = false;
    setScreenLoading(true);
    const response = await serverApi.EmbeddingsTransform({
      infoData:infoData,
      UID:UserInfo.UID
    })
    setScreenLoading(false);
    if(!g_serverCommError){
      getEmbeddings();
      setinfoData({...infoData,
        temp:{...infoData.temp,value:response.settings.temp},
        maxToken:{...infoData.temp,value:response.settings.maxToken},
        stopSeq:{...infoData.temp,value:response.settings.stopSeq},
        topP:{...infoData.temp,value:response.settings.topP},
        frequencyP:{...infoData.temp,value:response.settings.frequencyP},
        presenceP:{...infoData.temp,value:response.settings.presenceP},
        embTopP:{...infoData.temp,value:response.settings.embTopP},
      });
    }
  }
  const getEmbeddings = async()=>{
    g_serverCommError = false;
    const response = await serverApi.getEmbeddings({
      UID:UserInfo.UID
    })
    // console.log(response.data)
    if(!g_serverCommError){
      setembeddings(response.data.map((d,k)=>{return d;}))
    }
  }
  const getEmbeddingDetail = async(ID)=>{
    g_serverCommError = false;
    const response = await serverApi.getEmbeddingDetail({
      eID:ID
    })
    // console.log(response)
    if(!g_serverCommError){
      setDialog({des:response.data.Content});
      setDialogVisible(true);
    }
  }
  const deleteEmbeddings = async(ID)=>{
    setScreenLoading(true);
    g_serverCommError = false;
    const response = await serverApi.deleteEmbeddings({
      eID:ID
    })
    setScreenLoading(false);
    if(!g_serverCommError){
      getEmbeddings()
    }
  }
  const promptCast = async()=>{
    if(infoData.userPrompt.value==""){
      setgenerating(false);
      genOutputAbort.current = false;
      return false;
    }
    genOutputAbort.current = generating;
    setgenerating(!generating);
    if(genOutputAbort.current)return false;
    // setScreenLoading(true);
    const controller = new AbortController();
    const response = await fetch("/Iapi/promptCast",{
      method:"POST",
      headers:{
        "X-CSRF-TOKEN":g_csrfToken,
        "Accept": 'application/json',
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        timeOffset:g_timeoffset,
        UID:UserInfo.UID,
        infoData:infoData,
        content:infoData.userPrompt.value,
        lastUserContent:lastUserContent.current,
        lastAssistantContent:lastAssistantContent.current
      }),
      signal:controller.signal
    });
    // console.log(response)
    lastUserContent.current = infoData.userPrompt.value;
    lastAssistantContent.current = "";
    // setScreenLoading(false);
    const reader = response.body.getReader();
    const httpcode = response.status;
    // console.log("httpcode:",httpcode)
    const utf8decoder = new TextDecoder();
    // return reader.read();
    let finish = false;
    let responseText = "";
    let assistantText = "";
    let usage = null;
    let error = null;
    let cnt = 0;
    while(!finish){
      await reader.read().then(({value,done})=>{
        // console.log(value,done)
        const text = utf8decoder.decode(value);
        const content = text.match(/"content":"([^"]*)"/g);
        // console.log(text)
        if(text.match(/"status":107/)){
          setDialog({title:Helper.trans("miscellaneous.ErrorText"),des:Helper.trans("SystemMsg.LoginSomewhereElse")});
          setDialogVisible(true);
          g_onDialogComfirmHandler=()=>{
            g_onDialogComfirmHandler = ()=>{};
            g_onDialogCancelHandler = ()=>{};
            setDialogVisible(false);
            window.location.href = "/"
          }
        }
        const regex = /"prompt_tokens":(\d+),"completion_tokens":(\d+),"total_tokens":(\d+)/;
        usage = text.match(regex);
        error = text.match(/error/);
        if(content){
          content.forEach((c,k)=>{
            responseText += c.match(/"content":"([^"]*)"/)[1];
          })
        }
        finish = done;
      }).catch((e)=>{
        // console.log(e)
        setDialog({title:Helper.trans("miscellaneous.ErrorText"),des:"生成錯誤，請重新 Cast。"});
        setDialogVisible(true);
        genOutputAbort.current = true;
        responseText = "";
      });

      if(responseText){
        assistantText += responseText;
        if(usage){
          finish = true;
          responseText += `<br/><div style='color:#f8b214'>(${usage[0].replaceAll(/\"/g,"")})</div>`;
        }
        responseText = responseText.replaceAll(/\\n/g,'<br/>');
        setgenOutput(`<div style='margin-bottom:20px;display: flex;flex-direction: column;'>${genOutput}<div style='align-self:flex-end;margin:20px 5px 20px 0;background-color: #ccc;padding: 3px 10px;border-radius: 10px;'>${infoData.userPrompt.value}</div><div>${responseText}</div></div>`);
        const selector = document.getElementById('MsgResult');
        selector.scrollTop = selector.scrollHeight;
      }
      if(error){
        setDialog({title:Helper.trans("miscellaneous.ErrorText"),des:"生成錯誤，可能需要調整生成參數：建議 Temperature 與 Top P 在0.5~1之間。"});
        setDialogVisible(true);
      }else{
        lastAssistantContent.current = assistantText;
      }
      if(genOutputAbort.current)
      {
        controller.abort();
        finish = true;
      }
      cnt++;
    }
    genOutputAbort.current = false;
    setgenerating(false);
    setTimeout(() => {
      const selector = document.getElementById('MsgResult');
      selector.scrollTop = selector.scrollHeight;
    }, 500);
  }


  return (<Container className={"w-full flex flex-col items-center"} >
    <ControlFrame className="w-full flex rbshadow flex-col mt-3 ">
      <div className='flex self-center text-xl'>生成參數</div>
      <div className='flex w-full gap-3 pl-3 pr-3 items-center justify-center flex-wrap'>
        <ControlItem className="flex flex-col">
          <ItemTitle className="self-start">Temperature</ItemTitle>
          <div className='flex ml-1 mb-2 text-base text-slate-50'>
            生成詞語的機率，範圍在0到2之間，值越低，產生的詞語越固定；值越高，產生的詞語越隨機也越容易出錯，建議在 0.5~1 之間。
          </div>
          <TextInput style={{minWidth:'70px',width:'70px'}} placeholder='...'  className="fieldValue"
            value={infoData.temp.value}
            maxLength={4}
            pattern="[0-9]*[.]?[0-9]*"
            hintMsg=""
            onInput={(text)=>{setinfoData({...infoData,temp:{...infoData.temp,value:text}})}}
          />
          
        </ControlItem> 
        <ControlItem style={{backgroundColor:"#ce54cd"}} className="flex flex-col">
          <ItemTitle className="self-start">Top P</ItemTitle>
          <div className='flex ml-1 mb-2 text-base text-slate-50'>
            候選詞語機率閥值，範圍在0到1之間，值越低，候選詞語越少，產生的結果越固定；值越高，候選詞語越多，產生的結果越多樣，但也越容易出錯，建議在 0.5~1 之間。
          </div>
          <TextInput style={{minWidth:'70px',width:'70px'}} placeholder='...'  className="fieldValue"
            value={infoData.topP.value}
            maxLength={4}
            pattern="[0-9]*[.]?[0-9]*"
            hintMsg=""
            onInput={(text)=>{setinfoData({...infoData,topP:{...infoData.topP,value:text}})}}
          />
        </ControlItem> 
      </div>
      <div className='flex w-full gap-3 pl-3 pr-3 items-center justify-center flex-wrap'>
        <ControlItem style={{backgroundColor:"#5380e7"}} className="flex flex-col">
          <ItemTitle className="self-start">Maximum Tokens</ItemTitle>
          <div className='flex ml-1 mb-2 text-base text-slate-50'>
            範圍在1到4096之間，可以限制生成文本的長度，避免生成過長的内容。
          </div>
          <TextInput style={{minWidth:'70px',width:'70px'}} placeholder='...'  className="fieldValue"
            value={infoData.maxToken.value}
            maxLength={4}
            pattern="[0-9]*"
            hintMsg=""
            onInput={(text)=>{setinfoData({...infoData,maxToken:{...infoData.maxToken,value:text}})}}
          />
        </ControlItem> 
        <ControlItem style={{backgroundColor:"#d05880"}} className="flex items-center flex-col">
          <ItemTitle className="self-start">Stop Sequences</ItemTitle>
          <div className='flex ml-1 text-base self-start mb-2 mt-1 text-slate-50'>
            終止字符，生成內容若遇到終止字符則停止產生文本，例如：\n\n。
          </div>
          <TextInput style={{minWidth:'250px',width:'100%'}} placeholder='...'  className="fieldValue"
            value={infoData.stopSeq.value}
            hintMsg=""
            onInput={(text)=>{setinfoData({...infoData,stopSeq:{...infoData.stopSeq,value:text}})}}
          />
        </ControlItem> 
         
      </div>
      <div className='flex w-full gap-3 pl-3 pr-3 items-center justify-center flex-wrap'>
        <ControlItem style={{backgroundColor:"#1b79ff"}} className="flex flex-col">
          <ItemTitle className="self-start">Frequency Penalty</ItemTitle>
          <div className='flex ml-1 mb-2 text-base text-slate-50'>
            詞語重複懲罰，範圍在-2到2之間，值越高，重複機率越低，降低多次出现的詞語機率，具体到重複次數。
          </div>
          <TextInput style={{minWidth:'70px',width:'70px'}} placeholder='...'  className="fieldValue"
            value={infoData.frequencyP.value}
            maxLength={4}
            pattern="[0-9]*[.]?[0-9]*"
            hintMsg=""
            onInput={(text)=>{setinfoData({...infoData,frequencyP:{...infoData.frequencyP,value:text}})}}
          />
        </ControlItem>
        <ControlItem style={{backgroundColor:"#e9696d"}} className="flex flex-col">
          <ItemTitle className="self-start">Presence Penalty</ItemTitle>
          <div className='flex ml-1 mb-2 text-base text-slate-50'>
            詞語存在懲罰，範圍在-2到2之間，值越高，重複機率越低，降低已經出現過的詞語機率，與出現次數無關。
          </div>
          <TextInput style={{minWidth:'70px',width:'70px'}} placeholder='...'  className="fieldValue"
            value={infoData.presenceP.value}
            maxLength={4}
            pattern="[0-9]*[.]?[0-9]*"
            hintMsg=""
            onInput={(text)=>{setinfoData({...infoData,presenceP:{...infoData.presenceP,value:text}})}}
          />
        </ControlItem> 
      </div>
    </ControlFrame>
    <ControlFrame style={{padding:'10px'}} className="w-full flex rbshadow flex-col ">
      <div className='w-full flex mb-3 flex-col justify-center items-center'>
        <span className='text-xl'>Embeddings</span>
        <span className='text-base text-stone-400'>將高維數據（如單詞或句子）映射到低維向量空間中的過程。這個低維向量能夠捕捉原始數據的語義或特徵，使其在機器學習模型中更易於處理。</span>
      </div>
      <div className='flex justify-center flex-wrap gap-1'>
        <div className='flex flex-col gap-1 flex-auto relative'>
          <span style={{top:'-23px',left:'3px'}} className='absolute z-10'>{`${embeddingTextLength}/8191`}</span>
          <BlockInput placeholder='...' style={{height:'150px',minWidth:'400px'}}
            className="fieldValue" 
            resize={false}
            onFocus={(e)=>{e.target.select()}}
            value={infoData.embs.value} onInput={(text)=>{setembeddingTextLength(text.length);setinfoData({...infoData,embs:{...infoData.embs,value:text}})}}
          />
          <ActButton onClick={EmbeddingsTransform} text='Transform' className='w-full text-lg' />
        </div>
        <EmbRecords className='flex bg-slate-500 flex-col flex-auto overflow-auto'>
          {
          embeddings.length?embeddings.map((d,k)=>{
            return (<div onClick={(e)=>{getEmbeddingDetail(d.ID);}} style={{borderBottom:'1px solid #fff',height:'40px'}} className="flex items-center cursor-pointer flex-shrink-0" key={k}>
              <div className='text-lg cursor-pointer overflow-hidden whitespace-nowrap text-ellipsis block pr-2'>{k+1}. {d.shortContent}</div>
              <span onClick={(e)=>{e.preventDefault();e.stopPropagation();deleteEmbeddings(d.ID);}} style={{border:"1px solid #fff",borderRadius:'50px'}} className='flex ml-auto mr-1 w-6 h-6 items-center justify-center cursor-pointer flex-none'>X</span>
            </div>);
          }):<div className='flex self-center text-lg'>No Embeddings</div>
          }
        </EmbRecords>
      </div>
    </ControlFrame>
    <ControlFrame style={{padding:'10px'}} className="w-full flex rbshadow flex-col ">
      <div className='w-full flex mb-3 flex-col justify-center items-center'>
        <span className='text-xl'>系統提示</span>
        <span className='text-base text-stone-400'>通常用於設定初始條件、背景資訊或指導對話的整體方向。系統提示可以用來定義 AI 的行為方式和個性。</span>
      </div>
      <div className='flex flex-col gap-1 flex-auto'>
        <BlockInput placeholder='...' style={{height:'150px',minWidth:'380px'}}
          className="fieldValue" 
          resize={false}
          onFocus={(e)=>{e.target.select()}}
          value={infoData.systemPrompt.value} onInput={(text)=>{setinfoData({...infoData,systemPrompt:{...infoData.systemPrompt,value:text}})}}
        />
        <ActButton onClick={SaveSystemPrompt} text='Save' className='w-full text-lg' />
      </div>
    </ControlFrame>
    <ControlFrame style={{padding:'10px'}} className="w-full flex rbshadow flex-col ">
      <div className='w-full flex mb-3 flex-col justify-center items-center'>
        <span className='flex text-xl items-center gap-1'>
          <span>Prompt</span>
          <img className="select-none aspect-square object-cover w-5 h-5" src={AIstar} />
        </span>
        <span className='text-base text-stone-400'>由使用者發出的訊息。這是對話的輸入部分，用戶通過這些訊息向 AI 提問或進行互動。</span>
        <div className='flex items-center'>
          <div className='flex items-center'>
            <span className='mr-1'>Embedding P (1~3)</span>
            <TextInput style={{minWidth:'40px',width:'40px'}} placeholder='...'  className="fieldValue"
              value={infoData.embTopP.value}
              maxLength={1}
              pattern="[0-9]*[.]?[0-9]*"
              hintMsg=""
              onInput={(text)=>{setinfoData({...infoData,embTopP:{...infoData.embTopP,value:text}})}}
            />
          </div>
        </div>  
      </div>
      <div className='flex flex-col gap-1 flex-auto'>
        <BlockInput placeholder='...' style={{height:'150px',minWidth:'380px'}}
          className="fieldValue" 
          resize={false}
          onFocus={(e)=>{e.target.select()}}
          value={infoData.userPrompt.value} onInput={(text)=>{setinfoData({...infoData,userPrompt:{...infoData.userPrompt,value:text}})}}
        />
        <ActButton onClick={promptCast} text={!generating?'Cast':'■'} className='w-full text-lg' />
      </div>
    </ControlFrame>
    <ControlFrame style={{padding:'10px',gap:'0px'}} className="w-full flex rbshadow flex-col ">
      <div className='w-full flex  flex-col justify-center items-center mb-2'>
        <span className='text-xl'>生成結果</span>
      </div>
      <MsgResult id='MsgResult' dangerouslySetInnerHTML={{__html:genOutput}} className='flex w-full text-lg flex-col break-words'>
      </MsgResult>
      <ActButton onClick={()=>{setgenOutput("");}} text='Clear' className='w-full text-lg mt-1' />
    </ControlFrame>
    <Footer className='mb-5 mt-5' id='footer'>
      <span>{
        `v${g_appVersion} © 2024 MIGHT ELECTRONIC CO., LTD. All Rights Reserved.`}
      </span>
    </Footer>
  </Container>)

}

const styles = {
};

export default MainEntry;
