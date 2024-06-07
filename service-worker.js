importScripts('https://cdnjs.cloudflare.com/ajax/libs/pouchdb/8.0.1/pouchdb.min.js')
importScripts('js/sw-db.js')
const CACHE_STATIC_NAME='sw-una-task-static-v1';
const CACHE_DYNAMIC_NAME='sw-una-task-dynamic-v1';
const CACHE_INMUTABLE_NAME='sw-una-task-inmutable-v1';
const CACHE_LIMIT=200;

const apiKeys = {
    publicKey: 'BIze4x_-5Nn3IuaVockuL5f-IY_wENsDE-Vhtdwg6UckIF5hKN5zyTCEtBlBT5rFXEw3aSSkEplX1Va92GW8mg4',
    privateKey: '7V6E8__csB8ldCTfschXm9HotqiXy1leAtEBITGdro4'
};

const urlBase64ToUint8Array = base64String => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

self.addEventListener('install',event=>{
    console.log("Service worker en instalación");
    const cacheStaticProm= caches.open(CACHE_STATIC_NAME)
        .then(cache=>{
            return cache.addAll([
                '/',
                '/index.html',
                '/css/styles.css',
                '/img/imagen1.png',
                '/img/no-image.png',
                '/js/app.js'
            ]);
        });
    const cacheInmutableProm=caches.open(CACHE_INMUTABLE_NAME)
        .then(cache=>cache.addAll([
            'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/pouchdb/8.0.1/pouchdb.min.js'
        ]));
    event.waitUntil(Promise.all([
        cacheStaticProm,
        cacheInmutableProm
    ]));
});
self.addEventListener('activate', async (e) => {
    console.log("Service worker activo 2");
    const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(apiKeys.publicKey)
    })

    const response = await saveSubscription(subscription)
    console.log(response)
});
self.addEventListener('sync',event=>{
    // console.log("Tenemos conexión a Internet!");
    // console.log(event);
    // console.log(event.tag);
    console.log("Online.....")
    if(event.tag==='new-mutation'){
        event.waitUntil(syncOnline())
    }
});

const saveSubscription = async (subscription) => {
    const response = await fetch('https://una-task-api.onrender.com/save-subscription', {
        method: 'post',
        headers: { 'Content-type': "application/json" },
        body: JSON.stringify(subscription)
    });

    return response.json();
}



self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Notificación recibida', data);
    const options = {
        body: data.body,
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
    if(navigator.vibrate){
        navigator.vibrate([2000,1000,3000]);
    }
});

self.addEventListener('fetch',event=>{
    // console.log(event.request);
    // if(event.request.url.includes('boxicons')){
    //     const resp=new Response(`
    //         {ok:false,mensaje:'jajajaja'}
    //     `);
    //     event.respondWith(resp);
    // }

    //ESTRATEGIA 1: CACHE ONLY (Solo cache)
    // event.respondWith(caches.match(event.request));

    //ESTRATEGIA 2: CACHE WITH NETWORK FALLBACK 
    // const resp=caches.match(event.request)
    //     .then(res=>{
    //         if(res) return res;
    //         return fetch(event.request)
    //             .then(newResp=>{
    //                 caches.open(CACHE_DYNAMIC_NAME)
    //                     .then(cache=>{
    //                         cache.put(event.request,newResp);
    //                         clearCache(CACHE_DYNAMIC_NAME,CACHE_LIMIT);
    //                     });
    //                 return newResp;
    //             });
    //     });
    // event.respondWith(resp);

    //ESTRATEGIA 3: NETWORK WITH CACHE FALLBACK
    let resp;
    if(event.request.method==='POST'){
        /**
         * si se encuentra en linea y la petición es una query entonces:
         *      se debe hacer la petición y manejar la respuesta para almacenar el JSON
         *      en cache y luego retornar un clone de la respuesta
         * Si se esta offline se debe ir a buscar al cache ese JSON y retornar una nueva
         * respuesta con el JSON
         * Se debe tener cuidado con la QUERY a la que se está haciendo la petición
         * principalmente a la hora de guardar y recuperar del cache
         */
        if(self.registration.sync && !navigator.onLine){
            resp=event.request.clone().text().then(body=>{
                const bodyObj=JSON.parse(body)
                if(bodyObj.query.includes('mutation')){
                    return saveOnLocal(bodyObj)
                }else if(bodyObj.query.includes('tasks')){
                    return caches.match("tasks");
                }
                else{
                    //Queries, es decir, buscarla en cache
                    const newResp={ok:false,offline:true}
                    return new Response(JSON.stringify(newResp))
                }                
            })

        }else{
            resp = fetch(event.request).then(async respObj => {
                const respClone = respObj.clone();
                console.log("Datos recibidos con conexión");
                //console.log(await respClone.json());
                const data = await respClone.clone().json();
                if(data.token){
                    return respObj;
                }
                if(data.data.tasks){
                    console.log("La query respondió con una colección de tareas.");
                    caches.open(CACHE_DYNAMIC_NAME).then(cache => {
                        cache.put("tasks", respClone);
                        clearCache(CACHE_DYNAMIC_NAME, CACHE_LIMIT);
                    });
                }
                return respObj;
            });
            
        }
    }else{
        resp = fetch(event.request)
        .then(res=>{
            if(!res){
                return caches.match(event.request);
            }else{                
                caches.open(CACHE_DYNAMIC_NAME)
                    .then(cache=>{
                        cache.put(event.request,res);
                        clearCache(CACHE_DYNAMIC_NAME,CACHE_LIMIT);
                    });
                    return res.clone();
            }
        }).catch(err=>{
            return caches.match(event.request);
        });
    }    
    event.respondWith(resp);

    //ESTRATEGIA 4: NETWORK & CACHE RACE
    // const resp=new Promise((resolve,reject)=>{
    //     let flag=false;
    //     const fallOnce=()=>{
    //         if(flag){
    //             if(/\.(png|jpg)$/i.test(event.request.url)){
    //                 resolve(caches.match('img/no-image.png'));
    //             }
    //         }else{
    //             flag=true;
    //         }
    //     };
    //     fetch(event.request).then(res=>{
    //         res?resolve(res):fallOnce();
    //     }).catch(fallOnce);
    //     caches.match(event.request).then(res=>{
    //         res?resolve(res):fallOnce();
    //     }).catch(fallOnce);
    // });
    // event.respondWith(resp);
});

function clearCache(cacheName,maxItems){
    caches.open(cacheName)
    .then(cache=>{
        return cache.keys()
            .then(keys=>{
                if(keys.length>maxItems){
                    cache.delete(keys[0])
                        .then(clearCache(cacheName,maxItems));
                }
            });
    });
}