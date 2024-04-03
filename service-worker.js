const CACHE_STATIC_NAME='sw-una-task-static-v1';
const CACHE_DYNAMIC_NAME='sw-una-task-dynamic-v1';
const CACHE_INMUTABLE_NAME='sw-una-task-inmutable-v1';
const CACHE_LIMIT=200;

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
        .then(cache=>cache.add('https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css'));
    event.waitUntil(Promise.all([
        cacheStaticProm,
        cacheInmutableProm
    ]));
});
self.addEventListener('activate',event=>{
    console.log("Service worker activo 2");
});
self.addEventListener('sync',event=>{
    // console.log("Tenemos conexión a Internet!");
    // console.log(event);
    // console.log(event.tag);
});
self.addEventListener('push',event=>{
    console.log("Notificación recibida");
    console.log(event);    
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
    const resp=fetch(event.request)
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