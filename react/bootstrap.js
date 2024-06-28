
window._ = require('lodash');
import packageInfo from '../../package.json'
import * as Helper from './api/helper.js';
import * as serverApi from './api/serverApi.js';
import store from './redux/store'
import {setIsLoading,setLoadingTitle,setIsWait} from './redux/slices/Loading'
import {setsaveSuccess,setsaveValid} from './redux/slices/Saving'
import {setDialog,setDialogVisible,setFreezerVisible} from './redux/slices/Dialog'
import {setThemeMode} from './redux/slices/ThemeMode'
/**
 * We'll load jQuery and the Bootstrap jQuery plugin which provides support
 * for JavaScript based Bootstrap features such as modals and tabs. This
 * code may be modified to fit the specific needs of your application.
 */

try {
    window.Popper = require('popper.js').default;
    window.$ = window.jQuery = require('jquery');

    require('bootstrap');
} catch (e) {}

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

window.axios = require('axios');

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Next we will register the CSRF Token as a common header with Axios so that
 * all outgoing HTTP requests automatically have it attached. This is just
 * a simple convenience so we don't have to attach every token manually.
 */

let token = document.head.querySelector('meta[name="csrf-token"]');
global.g_csrfToken = "";
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
    global.g_csrfToken = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

global.g_LangArray = [];
global.g_LangArray['miscellaneous'] = require("./Lang/miscellaneous.json");

global.Helper = Helper;
global.serverApi = serverApi;
global.g_appVersion = packageInfo.version; 
global.webTitle = packageInfo.webTitle; 

global.g_timeoffset = new Date().getTimezoneOffset();
global.g_serverCommError = false;
global.g_serverTimeout = 10000;

global.g_onDialogComfirmHandler = ()=>{}
global.g_onDialogCancelHandler = ()=>{}
global.g_onLoadingCancelHandler = ()=>{}
global.setScreenLoading=(status)=>{store.dispatch(setIsLoading(status))}
global.setScreenLoadingWait=(status)=>{store.dispatch(setIsWait(status))}
global.setScreenLoadingTitle=(status)=>{store.dispatch(setLoadingTitle(status))}
global.setThemeMode=(status)=>{store.dispatch(setThemeMode(status))}
global.setSaveSuccess=(status)=>{store.dispatch(setsaveSuccess(status))}
global.setSaveValid=(status)=>{store.dispatch(setsaveValid(status))}
global.setDialog=(status)=>{store.dispatch(setDialog(status))}
global.setDialogVisible=(status)=>{store.dispatch(setDialogVisible(status))}
global.setFreezerVisible=(status)=>{store.dispatch(setFreezerVisible(status))}

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

// import Echo from 'laravel-echo'

// window.Pusher = require('pusher-js');

// window.Echo = new Echo({
//     broadcaster: 'pusher',
//     key: process.env.MIX_PUSHER_APP_KEY,
//     cluster: process.env.MIX_PUSHER_APP_CLUSTER,
//     encrypted: true
// });
