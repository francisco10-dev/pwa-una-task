const db=new PouchDB('offline_data')
const Authorization="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhQXN4ZXFzZXJmc2QiLCJlbWFpbCI6ImVkZGllckB1bmEuY3IiLCJuYW1lIjoiRWRkaWVyIiwiaWF0IjoxNzE1ODE5NDY5fQ.ASo1uQWXgNdLubpvbBKbs5loYhQIaHkN2t9TxT_ehhc";
const urlAPI="http://localhost:9000/graphql"

function saveOnLocal(data){
    data._id=new Date().toISOString();
    return db.put(data).then(
        ()=>{
            console.log("Sincronización guardada")
            self.registration.sync.register('new-mutation')
            const newResp={ok:true,offline:true}
            return new Response(JSON.stringify(newResp))
        }
    )
}
function syncOnline(){
    const promAll=[]
    return db.allDocs({include_docs:true}).then(docs=>{
        docs.rows.forEach(row=>{
            const doc=row.doc
            const query=fetchAPI(doc.query,doc.variables.input)
                .then(resp=>{
                    //verificar que fue exitosa
                    return db.remove(doc)
                })
            promAll.push(query)
        })
        return Promise.all(promAll)
    })
}

const fetchAPI=async (query,input)=>{
    const options={
        method:'POST',
        headers:{
            'Content-Type':'application/json',
            Authorization
        },
        body: JSON.stringify({
            query,
            variables:{
                input
            }
        })
    };
    const result=await fetch(urlAPI,options);
    const data= await result.json();
    console.log(data);
    return data;
}